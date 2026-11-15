import { Address, AddressType } from "@/types/customer";
import { prisma } from "./prisma";
import { AddressType as PrismaAddressType } from "@prisma/client";

export interface AddressInput {
  fullName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  type?: AddressType;
  isDefault?: boolean;
}

export function validateAddressInput(data: AddressInput): string | null {
  if (!data.fullName || data.fullName.trim().length < 2) {
    return "Full name must be at least 2 characters long.";
  }
  const cleanPhone = data.phone ? data.phone.replace(/\D/g, "") : "";
  if (!cleanPhone || cleanPhone.length < 10) {
    return "Please provide a valid 10-digit mobile number.";
  }
  if (!data.street || data.street.trim().length < 4) {
    return "Please provide a valid street / building address.";
  }
  if (!data.city || data.city.trim().length < 2) {
    return "Please enter a valid city.";
  }
  if (!data.state || data.state.trim().length < 2) {
    return "Please enter a valid state.";
  }
  const cleanPin = data.pincode ? data.pincode.replace(/\D/g, "") : "";
  if (!cleanPin || cleanPin.length !== 6) {
    return "Please provide a valid 6-digit postal PIN code.";
  }
  return null;
}

function mapPrismaType(type: PrismaAddressType): AddressType {
  switch (type) {
    case "STUDIO":
      return "studio";
    case "WORK":
      return "work";
    case "OTHER":
      return "other";
    default:
      return "home";
  }
}

function toPrismaType(type?: AddressType): PrismaAddressType {
  switch (type) {
    case "studio":
      return PrismaAddressType.STUDIO;
    case "work":
      return PrismaAddressType.WORK;
    case "other":
      return PrismaAddressType.OTHER;
    default:
      return PrismaAddressType.HOME;
  }
}

export interface IAddressRepository {
  getAddresses(customerId: string): Promise<Address[]>;
  getAddressById(customerId: string, addressId: string): Promise<Address | null>;
  addAddress(
    customerId: string,
    data: AddressInput
  ): Promise<{ success: boolean; address?: Address; error?: string }>;
  updateAddress(
    customerId: string,
    addressId: string,
    data: AddressInput
  ): Promise<{ success: boolean; address?: Address; error?: string }>;
  deleteAddress(
    customerId: string,
    addressId: string
  ): Promise<{ success: boolean; error?: string }>;
  setDefaultAddress(
    customerId: string,
    addressId: string
  ): Promise<{ success: boolean; error?: string }>;
}

export class PrismaAddressRepository implements IAddressRepository {
  public async getAddresses(customerId: string): Promise<Address[]> {
    const list = await prisma.address.findMany({
      where: { customerId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return list.map((a) => ({
      id: a.id,
      customerId: a.customerId,
      fullName: a.fullName,
      phone: a.phone,
      street: a.street,
      apartment: a.apartment || undefined,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      country: a.country,
      type: mapPrismaType(a.type),
      isDefault: a.isDefault,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  public async getAddressById(
    customerId: string,
    addressId: string
  ): Promise<Address | null> {
    const addr = await prisma.address.findFirst({
      where: { id: addressId, customerId },
    });
    if (!addr) return null;

    return {
      id: addr.id,
      customerId: addr.customerId,
      fullName: addr.fullName,
      phone: addr.phone,
      street: addr.street,
      apartment: addr.apartment || undefined,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
      type: mapPrismaType(addr.type),
      isDefault: addr.isDefault,
      createdAt: addr.createdAt.toISOString(),
    };
  }

  public async addAddress(
    customerId: string,
    data: AddressInput
  ): Promise<{ success: boolean; address?: Address; error?: string }> {
    const validationError = validateAddressInput(data);
    if (validationError) {
      return { success: false, error: validationError };
    }

    try {
      const existingCount = await prisma.address.count({
        where: { customerId },
      });
      const shouldBeDefault = data.isDefault || existingCount === 0;

      const created = await prisma.$transaction(async (tx) => {
        if (shouldBeDefault) {
          await tx.address.updateMany({
            where: { customerId },
            data: { isDefault: false },
          });
        }

        return tx.address.create({
          data: {
            customerId,
            fullName: data.fullName.trim(),
            phone: data.phone.replace(/\D/g, ""),
            street: data.street.trim(),
            apartment: data.apartment ? data.apartment.trim() : undefined,
            city: data.city.trim(),
            state: data.state.trim(),
            pincode: data.pincode.replace(/\D/g, ""),
            country: data.country ? data.country.trim() : "India",
            type: toPrismaType(data.type),
            isDefault: shouldBeDefault,
          },
        });
      });

      return {
        success: true,
        address: {
          id: created.id,
          customerId: created.customerId,
          fullName: created.fullName,
          phone: created.phone,
          street: created.street,
          apartment: created.apartment || undefined,
          city: created.city,
          state: created.state,
          pincode: created.pincode,
          country: created.country,
          type: mapPrismaType(created.type),
          isDefault: created.isDefault,
          createdAt: created.createdAt.toISOString(),
        },
      };
    } catch {
      return { success: false, error: "Failed to create address record." };
    }
  }

  public async updateAddress(
    customerId: string,
    addressId: string,
    data: AddressInput
  ): Promise<{ success: boolean; address?: Address; error?: string }> {
    const validationError = validateAddressInput(data);
    if (validationError) {
      return { success: false, error: validationError };
    }

    try {
      const existing = await prisma.address.findFirst({
        where: { id: addressId, customerId },
      });
      if (!existing) {
        return { success: false, error: "Address not found or access denied." };
      }

      const shouldBeDefault = data.isDefault === true;

      const updated = await prisma.$transaction(async (tx) => {
        if (shouldBeDefault) {
          await tx.address.updateMany({
            where: { customerId },
            data: { isDefault: false },
          });
        }

        return tx.address.update({
          where: { id: addressId },
          data: {
            fullName: data.fullName.trim(),
            phone: data.phone.replace(/\D/g, ""),
            street: data.street.trim(),
            apartment: data.apartment ? data.apartment.trim() : undefined,
            city: data.city.trim(),
            state: data.state.trim(),
            pincode: data.pincode.replace(/\D/g, ""),
            country: data.country ? data.country.trim() : "India",
            type: toPrismaType(data.type),
            isDefault: shouldBeDefault || existing.isDefault,
          },
        });
      });

      return {
        success: true,
        address: {
          id: updated.id,
          customerId: updated.customerId,
          fullName: updated.fullName,
          phone: updated.phone,
          street: updated.street,
          apartment: updated.apartment || undefined,
          city: updated.city,
          state: updated.state,
          pincode: updated.pincode,
          country: updated.country,
          type: mapPrismaType(updated.type),
          isDefault: updated.isDefault,
          createdAt: updated.createdAt.toISOString(),
        },
      };
    } catch {
      return { success: false, error: "Failed to update address record." };
    }
  }

  public async deleteAddress(
    customerId: string,
    addressId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await prisma.address.findFirst({
        where: { id: addressId, customerId },
      });
      if (!existing) {
        return { success: false, error: "Address not found or access denied." };
      }

      await prisma.$transaction(async (tx) => {
        await tx.address.delete({
          where: { id: addressId },
        });

        if (existing.isDefault) {
          const next = await tx.address.findFirst({
            where: { customerId },
            orderBy: { createdAt: "desc" },
          });
          if (next) {
            await tx.address.update({
              where: { id: next.id },
              data: { isDefault: true },
            });
          }
        }
      });

      return { success: true };
    } catch {
      return { success: false, error: "Failed to delete address record." };
    }
  }

  public async setDefaultAddress(
    customerId: string,
    addressId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const target = await prisma.address.findFirst({
        where: { id: addressId, customerId },
      });
      if (!target) {
        return { success: false, error: "Address not found or access denied." };
      }

      await prisma.$transaction([
        prisma.address.updateMany({
          where: { customerId },
          data: { isDefault: false },
        }),
        prisma.address.update({
          where: { id: addressId },
          data: { isDefault: true },
        }),
      ]);

      return { success: true };
    } catch {
      return { success: false, error: "Failed to update default address." };
    }
  }
}

export const addressRepository = new PrismaAddressRepository();
