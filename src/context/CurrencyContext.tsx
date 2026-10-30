"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  CurrencyCode,
  CurrencyDefinition,
  MarketCountry,
  SUPPORTED_CURRENCIES,
  DEFAULT_MARKETS,
} from "@/types/international";

interface CurrencyContextType {
  currency: CurrencyCode;
  currencyInfo: CurrencyDefinition;
  setCurrency: (code: CurrencyCode) => void;
  activeMarket: MarketCountry;
  setMarket: (countryCode: string) => void;
  convertPrice: (amountInInr: number) => number;
  formatPrice: (amountInInr: number) => string;
  exchangeRates: Record<CurrencyCode, number>;
  availableMarkets: MarketCountry[];
}

const DEFAULT_RATES: Record<CurrencyCode, number> = {
  INR: 1.0,
  USD: 0.0118,
  EUR: 0.0109,
  GBP: 0.0093,
  AED: 0.0433,
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>("INR");
  const [activeMarketCode, setActiveMarketCode] = useState<string>("IN");
  const [exchangeRates, setExchangeRates] = useState<Record<CurrencyCode, number>>(DEFAULT_RATES);
  const [availableMarkets, setAvailableMarkets] = useState<MarketCountry[]>(DEFAULT_MARKETS);

  // Load preferences from localStorage and check backend config
  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem("nexu_currency") as CurrencyCode;
      if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency]) {
        setCurrencyState(savedCurrency);
      }
      const savedMarket = localStorage.getItem("nexu_market");
      if (savedMarket) {
        setActiveMarketCode(savedMarket);
      }
    } catch {}

    // Fetch live market settings from public endpoint if available
    fetch("/api/settings/public")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings?.exchange_rates) {
          try {
            const parsed = JSON.parse(data.settings.exchange_rates);
            setExchangeRates((prev) => ({ ...prev, ...parsed }));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    if (SUPPORTED_CURRENCIES[code]) {
      setCurrencyState(code);
      try {
        localStorage.setItem("nexu_currency", code);
      } catch {}
    }
  };

  const setMarket = (countryCode: string) => {
    const market = availableMarkets.find((m) => m.code === countryCode);
    if (market) {
      setActiveMarketCode(market.code);
      setCurrency(market.defaultCurrency);
      try {
        localStorage.setItem("nexu_market", market.code);
      } catch {}
    }
  };

  const activeMarket =
    availableMarkets.find((m) => m.code === activeMarketCode) || DEFAULT_MARKETS[0];
  const currencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.INR;

  const convertPrice = (amountInInr: number): number => {
    const rate = exchangeRates[currency] || 1.0;
    return amountInInr * rate;
  };

  const formatPrice = (amountInInr: number): string => {
    const converted = convertPrice(amountInInr);
    if (currency === "INR") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(converted);
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: currencyInfo.fractionDigits,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyInfo,
        setCurrency,
        activeMarket,
        setMarket,
        convertPrice,
        formatPrice,
        exchangeRates,
        availableMarkets,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
