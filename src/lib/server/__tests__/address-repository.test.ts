import { describe, it, expect } from "vitest";
import {
  addressRepository,
  validateAddressInput,
  AddressInput,
} from "../address-repository";

describe("address-repository - Validation Rules", () => {
  it("rejects invalid input data", () => {
    const invalidName: AddressInput = {
      fullName: "A",
      phone: "9876543210",
      street: "123 Craft Lane",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
    };
    expect(validateAddressInput(invalidName)).toContain("at least 2 characters");

    const invalidPhone: AddressInput = {
      fullName: "Devika Rao",
      phone: "12345",
      street: "123 Craft Lane",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
    };
    expect(validateAddressInput(invalidPhone)).toContain("10-digit mobile number");

    const invalidPincode: AddressInput = {
      fullName: "Devika Rao",
      phone: "9876543210",
      street: "123 Craft Lane",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "3020",
    };
    expect(validateAddressInput(invalidPincode)).toContain("6-digit postal PIN code");
  });

  it("approves valid address inputs", () => {
    const valid: AddressInput = {
      fullName: "Devika Rao",
      phone: "9876543210",
      street: "Heritage Villa, MI Road",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
    };
    expect(validateAddressInput(valid)).toBeNull();
  });
});

describe("address-repository - Customer Isolation & CRUD", () => {
  const patronA = "usr_patron_01";
  const patronB = "usr_patron_02";

  it("lists seeded addresses for patron A", async () => {
    const addresses = await addressRepository.getAddresses(patronA);
    expect(addresses.length).toBeGreaterThanOrEqual(1);
    expect(addresses.every((a) => a.customerId === patronA)).toBe(true);
  });

  it("creates, updates, and deletes an address for a customer", async () => {
    const newAddr: AddressInput = {
      fullName: "Aarav Mehta Holiday Home",
      phone: "9876543210",
      street: "Casa Silva, Calangute",
      city: "Goa",
      state: "Goa",
      pincode: "403516",
      type: "home",
    };

    const added = await addressRepository.addAddress(patronA, newAddr);
    expect(added.success).toBe(true);
    expect(added.address).toBeDefined();
    const createdId = added.address!.id;

    // Update
    const updated = await addressRepository.updateAddress(patronA, createdId, {
      ...newAddr,
      apartment: "Villa 9",
    });
    expect(updated.success).toBe(true);
    expect(updated.address?.apartment).toBe("Villa 9");

    // Delete
    const deleted = await addressRepository.deleteAddress(patronA, createdId);
    expect(deleted.success).toBe(true);
    expect(await addressRepository.getAddressById(patronA, createdId)).toBeNull();
  });

  it("strictly prevents Customer B from accessing or altering Customer A's address", async () => {
    const patronAAddresses = await addressRepository.getAddresses(patronA);
    const targetAddressId = patronAAddresses[0].id;

    // Customer B attempts to get Customer A's address
    const unauthorizedGet = await addressRepository.getAddressById(patronB, targetAddressId);
    expect(unauthorizedGet).toBeNull();

    // Customer B attempts to update Customer A's address
    const unauthorizedUpdate = await addressRepository.updateAddress(patronB, targetAddressId, {
      fullName: "Hacker Attempt",
      phone: "9999999999",
      street: "Hacked Street",
      city: "Delhi",
      state: "Delhi",
      pincode: "110001",
    });
    expect(unauthorizedUpdate.success).toBe(false);
    expect(unauthorizedUpdate.error).toMatch(/access denied/i);

    // Customer B attempts to delete Customer A's address
    const unauthorizedDelete = await addressRepository.deleteAddress(patronB, targetAddressId);
    expect(unauthorizedDelete.success).toBe(false);
    expect(unauthorizedDelete.error).toMatch(/access denied/i);
  });

  it("handles setting a default address cleanly across addresses", async () => {
    // Add two addresses
    const res1 = await addressRepository.addAddress(patronA, {
      fullName: "Aarav Studio West",
      phone: "9876543210",
      street: "404 West End Road",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
    });
    const addr1 = res1.address!;

    const res2 = await addressRepository.addAddress(patronA, {
      fullName: "Aarav Studio East",
      phone: "9876543210",
      street: "808 East End Road",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400051",
    });
    const addr2 = res2.address!;

    // Set addr1 as default
    await addressRepository.setDefaultAddress(patronA, addr1.id);
    const check1 = await addressRepository.getAddressById(patronA, addr1.id);
    const check2 = await addressRepository.getAddressById(patronA, addr2.id);
    expect(check1?.isDefault).toBe(true);
    expect(check2?.isDefault).toBe(false);

    // Set addr2 as default
    await addressRepository.setDefaultAddress(patronA, addr2.id);
    const check1b = await addressRepository.getAddressById(patronA, addr1.id);
    const check2b = await addressRepository.getAddressById(patronA, addr2.id);
    expect(check1b?.isDefault).toBe(false);
    expect(check2b?.isDefault).toBe(true);

    // Clean up
    await addressRepository.deleteAddress(patronA, addr1.id);
    await addressRepository.deleteAddress(patronA, addr2.id);
  });
});
