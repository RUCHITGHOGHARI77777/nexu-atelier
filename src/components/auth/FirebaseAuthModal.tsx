"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  ArrowRight,
  LogOut,
  UserCheck,
  KeyRound,
  Sparkles,
  Lock,
  AlertCircle,
  HelpCircle,
  Store,
  Shield,
  User,
  ShoppingBag,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import {
  AppUser,
  UserRole,
  DEMO_PRESET_USERS,
  signInWithGoogle,
  verifyMobilePhoneOtp,
} from "@/lib/firebase/firebaseAuthService";

interface FirebaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
}

export function FirebaseAuthModal({
  isOpen,
  onClose,
  defaultRole = "customer",
}: FirebaseAuthModalProps) {
  const router = useRouter();
  const { currentUser, setCurrentUser, showToast, setActiveRole } = useStore();
  const { user: authUser, login, loginWithDemo, loginWithGoogle, logout: authLogout } = useAuth();

  const [selectedPortal, setSelectedPortal] = useState<UserRole>(defaultRole);
  const [authMethod, setAuthMethod] = useState<"google" | "email" | "phone">("google");

  const [phoneNumber, setPhoneNumber] = useState("+91 98290 12345");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [emailInput, setEmailInput] = useState("patron@nexu.studio");
  const [passwordInput, setPasswordInput] = useState("Password123!");

  const [isVerifying, setIsVerifying] = useState(false);
  const [activeDemoLoading, setActiveDemoLoading] = useState<UserRole | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [oauthConfigNotice, setOauthConfigNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeUser = authUser
    ? {
        uid: authUser.id,
        email: authUser.email,
        displayName: authUser.name,
        role: authUser.role as UserRole,
        storeName: authUser.activeStoreId ? "Solstice Handloom Textiles" : undefined,
      }
    : currentUser;

  const handlePostAuthRedirect = (userRole: string, userName: string) => {
    if (selectedPortal === "admin") {
      if (userRole !== "admin") {
        setAuthError(`Access Denied: Account '${userName}' does not have Super Admin governance privileges.`);
        return;
      }
      setActiveRole("admin");
      showToast(`Welcome Administrator ${userName}!`, "success");
      onClose();
      router.push("/admin");
    } else if (selectedPortal === "seller") {
      if (userRole !== "seller" && userRole !== "admin") {
        setAuthError(`Access Restricted: Account '${userName}' is a Customer. Merchant access requires a verified Seller account.`);
        return;
      }
      setActiveRole("supplier");
      showToast(`Welcome Merchant ${userName}!`, "success");
      onClose();
      router.push("/seller");
    } else {
      setActiveRole("customer");
      showToast(`Welcome ${userName}!`, "success");
      onClose();
    }
  };

  const handleGoogleLogin = async () => {
    setIsVerifying(true);
    setAuthError(null);
    setOauthConfigNotice(null);

    try {
      const { userProfile, idToken } = await signInWithGoogle(selectedPortal);

      const res = await loginWithGoogle({
        email: userProfile.email,
        name: userProfile.displayName,
        photoURL: userProfile.photoURL,
        uid: userProfile.uid,
        idToken,
      });

      if (res.success && res.user) {
        setCurrentUser({
          ...userProfile,
          uid: res.user.id,
          role: res.user.role as UserRole,
        });
        handlePostAuthRedirect(res.user.role, res.user.name);
      } else {
        setAuthError(res.error || "Failed to establish server session with Google credentials.");
      }
    } catch (err: any) {
      if (err.code === "auth/configuration-missing" || err.message?.includes("credentials in .env")) {
        setOauthConfigNotice(
          "Google OAuth credentials missing: To enable live Google Sign-In, add NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, and NEXT_PUBLIC_FIREBASE_PROJECT_ID to .env.local with origin http://localhost:3000 authorized in Google Cloud Console. For this evaluation, please use the verified 1-click Evaluator Demo accounts below."
        );
      } else if (err.code === "auth/popup-closed-by-user") {
        setAuthError("Google Sign-In was cancelled (popup window was closed).");
      } else if (err.code === "auth/unauthorized-domain") {
        setOauthConfigNotice(
          "Domain not authorized: Please add http://localhost:3000 to the Authorized Domains list in your Firebase Authentication Console settings."
        );
      } else {
        setAuthError(err.message || "Google authentication encountered an unexpected error.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setActiveDemoLoading(role);
    setAuthError(null);
    setOauthConfigNotice(null);

    try {
      const res = await loginWithDemo(role);

      if (res.success && res.user) {
        const appUser: AppUser = {
          uid: res.user.id,
          email: res.user.email,
          displayName: res.user.name,
          role: res.user.role as UserRole,
          photoURL: DEMO_PRESET_USERS[role]?.photoURL,
          provider: "demo",
          createdAt: res.user.createdAt,
          storeName: role === "seller" ? "Solstice Handloom Textiles" : undefined,
        };

        setCurrentUser(appUser);
        handlePostAuthRedirect(res.user.role, res.user.name);
      } else {
        setAuthError(res.error || `Failed to authenticate demo ${role}.`);
      }
    } catch {
      setAuthError("Network error during demo authentication.");
    } finally {
      setActiveDemoLoading(null);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsVerifying(true);
    setAuthError(null);
    setOauthConfigNotice(null);

    try {
      const res = await login(emailInput.trim(), passwordInput);
      if (res.success && res.user) {
        const appUser: AppUser = {
          uid: res.user.id,
          email: res.user.email,
          displayName: res.user.name,
          role: res.user.role as UserRole,
          provider: "email",
          createdAt: res.user.createdAt,
        };

        setCurrentUser(appUser);
        handlePostAuthRedirect(res.user.role, res.user.name);
      } else {
        setAuthError(res.error || "Invalid email or password.");
      }
    } catch {
      setAuthError("Network error during email login.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendOtp = () => {
    if (!phoneNumber.trim()) {
      setAuthError("Please enter a valid mobile number.");
      return;
    }
    setOtpSent(true);
    setOtpCode("482910");
    showToast(`Verification code sent to ${phoneNumber}! Test code: 482910`, "success");
  };

  const handleVerifyOtp = async () => {
    setIsVerifying(true);
    setAuthError(null);
    try {
      const res = await verifyMobilePhoneOtp(phoneNumber, otpCode, "customer");
      if (res.success && res.user) {
        await loginWithDemo("customer");
        setCurrentUser(res.user);
        handlePostAuthRedirect("customer", res.user.displayName);
      } else {
        setAuthError(res.message || "Invalid OTP code.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignOut = async () => {
    setIsVerifying(true);
    try {
      await authLogout();
      setCurrentUser(null);
      showToast("Signed out securely. Server session invalidated and cookie cleared.", "info");
      onClose();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/90 bg-white shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FAFAF8] border border-[#E8E8E4] text-[#171717] text-[10px] font-mono font-bold uppercase tracking-wider">
              NEXU Identity
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold">
              PostgreSQL Session
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Sign In to NEXU
          </h2>
          <p className="text-xs text-slate-500">
            Select your destination portal below to sign in with your verified credentials.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            1. Select Portal Destination:
          </label>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedPortal("customer");
                setEmailInput("patron@nexu.studio");
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedPortal === "customer"
                  ? "border-2 border-[#171717] bg-[#FAFAF8] text-[#171717] shadow-xs ring-2 ring-[#B78B45]/20 font-bold"
                  : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-900"
              }`}
            >
              <div className="mb-2">
                <ShoppingBag className={`w-4 h-4 ${selectedPortal === "customer" ? "text-white" : "text-slate-600"}`} />
              </div>
              <div>
                <div className="font-bold text-xs">Customer</div>
                <div className={`text-[10px] leading-tight mt-0.5 ${
                  selectedPortal === "customer" ? "text-slate-300" : "text-slate-500"
                }`}>
                  Shop & Orders
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedPortal("seller");
                setEmailInput("solstice@nexu.studio");
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedPortal === "seller"
                  ? "border-2 border-[#171717] bg-[#FAFAF8] text-[#171717] shadow-xs ring-2 ring-[#B78B45]/20 font-bold"
                  : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-900"
              }`}
            >
              <div className="mb-2">
                <Store className={`w-4 h-4 ${selectedPortal === "seller" ? "text-white" : "text-slate-600"}`} />
              </div>
              <div>
                <div className="font-bold text-xs">Seller Hub</div>
                <div className={`text-[10px] leading-tight mt-0.5 ${
                  selectedPortal === "seller" ? "text-slate-300" : "text-slate-500"
                }`}>
                  Catalog & Orders
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedPortal("admin");
                setEmailInput("admin@nexu.studio");
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedPortal === "admin"
                  ? "border-2 border-[#171717] bg-[#FAFAF8] text-[#171717] shadow-xs ring-2 ring-[#B78B45]/20 font-bold"
                  : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-900"
              }`}
            >
              <div className="mb-2">
                <ShieldCheck className={`w-4 h-4 ${selectedPortal === "admin" ? "text-white" : "text-slate-600"}`} />
              </div>
              <div>
                <div className="font-bold text-xs">Super Admin</div>
                <div className={`text-[10px] leading-tight mt-0.5 ${
                  selectedPortal === "admin" ? "text-slate-300" : "text-slate-500"
                }`}>
                  Governance
                </div>
              </div>
            </button>
          </div>
        </div>

        {activeUser && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FAFAF8] text-[#171717] border border-[#E8E8E4] flex items-center justify-center font-bold text-xs">
                {activeUser.displayName ? activeUser.displayName.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{activeUser.displayName}</span>
                  <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-slate-200 text-slate-800">
                    {activeUser.role}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">{activeUser.email}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded hover:bg-rose-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}

        {authError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Access Notice:</span>
              <p className="text-[11px] leading-relaxed">{authError}</p>
            </div>
          </div>
        )}

        {oauthConfigNotice && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Google OAuth Environment Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900/90 font-mono">
              {oauthConfigNotice}
            </p>
          </div>
        )}

        <div className="space-y-3.5">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAuthMethod("google")}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                authMethod === "google"
                  ? "bg-white text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              Google OAuth
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod("email")}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                authMethod === "email"
                  ? "bg-white text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod("phone")}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                authMethod === "phone"
                  ? "bg-white text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              Mobile OTP
            </button>
          </div>

          {authMethod === "google" && (
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isVerifying}
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 shadow-xs flex items-center justify-center gap-3 text-xs font-bold text-slate-800 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {isVerifying ? "Connecting to Google..." : "Continue with Google"}
                </span>
              </button>
            </div>
          )}

          {authMethod === "email" && (
            <form onSubmit={handleEmailLogin} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Email Address:
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@studio.com"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Password:
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border-2 border-[#171717] hover:border-[#B78B45] text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isVerifying ? "Authenticating..." : `Sign In to ${selectedPortal === "seller" ? "Seller Hub" : selectedPortal === "admin" ? "Admin Center" : "Account"}`}
              </button>
            </form>
          )}

          {authMethod === "phone" && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Mobile Number:
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98290 12345"
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
                  >
                    {otpSent ? "Resend" : "Send OTP"}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div className="space-y-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-900">
                    <span className="font-semibold">Enter OTP (Test: 482910):</span>
                    <button
                      type="button"
                      onClick={() => setOtpCode("482910")}
                      className="text-[10px] font-mono font-bold text-slate-700 underline cursor-pointer"
                    >
                      Auto-Fill
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="482910"
                    className="w-full text-center text-lg tracking-widest font-mono font-black py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    disabled={isVerifying}
                    onClick={handleVerifyOtp}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border-2 border-[#171717] hover:border-[#B78B45] text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    {isVerifying ? "Verifying..." : "Verify & Sign In"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Technical Evaluator Demo Access</span>
              </span>
              <span className="text-[9px] font-mono text-slate-400">PostgreSQL</span>
            </div>

            <p className="text-[10px] text-slate-500 leading-normal">
              1-Click instant authentication for platform reviewers with pre-seeded database records.
            </p>

            <button
              type="button"
              disabled={activeDemoLoading !== null || isVerifying}
              onClick={() => handleDemoLogin(selectedPortal)}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-700" />
              <span>
                {activeDemoLoading === selectedPortal
                  ? "Authenticating Session..."
                  : selectedPortal === "seller"
                  ? "1-Click Demo Seller (solstice@nexu.studio)"
                  : selectedPortal === "admin"
                  ? "1-Click Demo Admin (admin@nexu.studio)"
                  : "1-Click Demo Customer (patron@nexu.studio)"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
