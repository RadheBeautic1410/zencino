"use client";

import {
  MapPin,
  PencilSimple,
  Plus,
  SpinnerGap,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import {
  deleteAddressAction,
  saveAddressAction,
  setDefaultAddressAction,
} from "@/app/actions/addresses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface SavedAddress {
  city: string;
  countryCode: string;
  createdAt: Date;
  id: string;
  isDefault: boolean;
  line1: string;
  line2: string | null;
  phone: string;
  postcode: string;
  recipient: string;
  state: string;
}

export function AddressManager({
  initialAddresses,
}: {
  initialAddresses: SavedAddress[];
}) {
  const [addresses, setAddresses] = useState<SavedAddress[]>(initialAddresses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [recipient, setRecipient] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setEditingAddress(null);
    setRecipient("");
    setPhone("");
    setLine1("");
    setLine2("");
    setCity("");
    setState("");
    setPostcode("");
    setIsDefault(false);
    setIsFormOpen(false);
    setError(null);
  };

  const handleOpenEdit = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setRecipient(addr.recipient);
    setPhone(addr.phone);
    setLine1(addr.line1);
    setLine2(addr.line2 || "");
    setCity(addr.city);
    setState(addr.state);
    setPostcode(addr.postcode);
    setIsDefault(addr.isDefault);
    setIsFormOpen(true);
    setError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate PIN code
    if (!/^[1-9][0-9]{5}$/.test(postcode.trim())) {
      setError("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    if (phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const formData = new FormData();
    if (editingAddress) {
      formData.append("id", editingAddress.id);
    }
    formData.append("recipient", recipient.trim());
    formData.append("phone", phone.trim());
    formData.append("line1", line1.trim());
    formData.append("line2", line2.trim());
    formData.append("city", city.trim());
    formData.append("state", state.trim());
    formData.append("postcode", postcode.trim());
    formData.append("isDefault", isDefault ? "true" : "false");

    startTransition(async () => {
      const res = await saveAddressAction(formData);
      if (res.error) {
        setError(res.error);
      } else {
        resetForm();
        window.location.reload();
      }
    });
  };

  const handleDelete = (addressId: string) => {
    // biome-ignore lint/suspicious/noAlert: native confirmation kept until a shared dialog component exists.
    if (!confirm("Are you sure you want to remove this delivery address?")) {
      return;
    }

    startTransition(async () => {
      const res = await deleteAddressAction(addressId);
      if (res.error) {
        setError(res.error);
      } else {
        setAddresses((prev) => prev.filter((a) => a.id !== addressId));
      }
    });
  };

  const handleSetDefault = (addressId: string) => {
    startTransition(async () => {
      const res = await setDefaultAddressAction(addressId);
      if (res.error) {
        setError(res.error);
      } else {
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a.id === addressId,
          }))
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Saved Delivery Addresses
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your saved delivery destinations for fast, 1-click checkout.
          </p>
        </div>

        {!isFormOpen && (
          <Button
            className="h-9 gap-1.5 text-xs font-bold uppercase tracking-ui"
            onClick={handleOpenCreate}
            size="sm"
          >
            <Plus size={16} weight="bold" /> Add New Address
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
          <WarningCircle className="shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Add / Edit Form Modal / Panel */}
      {isFormOpen && (
        <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold uppercase tracking-ui text-foreground">
              {editingAddress
                ? "Edit Delivery Address"
                : "Add New Delivery Address"}
            </h3>
            <Button
              className="h-7 text-xs"
              onClick={resetForm}
              size="sm"
              variant="ghost"
            >
              Cancel
            </Button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="address-manager-full-name-recipient"
                >
                  Full Name / Recipient{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  className="text-xs"
                  id="address-manager-full-name-recipient"
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  required
                  value={recipient}
                />
              </div>

              <div>
                <label
                  className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="address-manager-10-digit-mobile-number"
                >
                  10-Digit Mobile Number{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  className="text-xs"
                  id="address-manager-10-digit-mobile-number"
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                  type="tel"
                  value={phone}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                htmlFor="address-manager-flat-house-no-building"
              >
                Flat, House no., Building, Apartment{" "}
                <span className="text-destructive">*</span>
              </label>
              <Input
                className="text-xs"
                id="address-manager-flat-house-no-building"
                onChange={(e) => setLine1(e.target.value)}
                placeholder="e.g. Flat 302, Palm Heights"
                required
                value={line1}
              />
            </div>

            <div>
              <label
                className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                htmlFor="address-manager-area-street-sector-landmark"
              >
                Area, Street, Sector, Landmark (Optional)
              </label>
              <Input
                className="text-xs"
                id="address-manager-area-street-sector-landmark"
                onChange={(e) => setLine2(e.target.value)}
                placeholder="e.g. Near HDFC Bank, Mindspace"
                value={line2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="address-manager-pin-code"
                >
                  PIN Code <span className="text-destructive">*</span>
                </label>
                <Input
                  className="text-xs font-mono"
                  id="address-manager-pin-code"
                  maxLength={6}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="e.g. 400064"
                  required
                  type="text"
                  value={postcode}
                />
              </div>

              <div>
                <label
                  className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="address-manager-town-city"
                >
                  Town / City <span className="text-destructive">*</span>
                </label>
                <Input
                  className="text-xs"
                  id="address-manager-town-city"
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  required
                  value={city}
                />
              </div>

              <div>
                <label
                  className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="address-manager-state"
                >
                  State <span className="text-destructive">*</span>
                </label>
                <Input
                  className="text-xs"
                  id="address-manager-state"
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  required
                  value={state}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs">
              <input
                checked={isDefault}
                className="size-4 rounded border-border text-primary focus:ring-primary"
                onChange={(e) => setIsDefault(e.target.checked)}
                type="checkbox"
              />
              <span className="text-muted-foreground font-medium">
                Set as default delivery address for future orders
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                className="text-xs"
                onClick={resetForm}
                size="sm"
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="gap-2 text-xs font-bold uppercase tracking-ui"
                disabled={isPending}
                size="sm"
                type="submit"
              >
                {isPending && <SpinnerGap className="animate-spin" size={14} />}
                {editingAddress ? "Update Address" : "Save Address"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Address Cards List */}
      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mx-auto">
            <MapPin size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              No Saved Addresses
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Add your delivery addresses to speed through checkout on future
              purchases.
            </p>
          </div>
          <Button
            className="text-xs font-bold uppercase tracking-ui"
            onClick={handleOpenCreate}
            size="sm"
          >
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div
              className={`rounded-2xl border p-5 bg-card flex flex-col justify-between transition-all ${
                addr.isDefault
                  ? "border-primary/50 shadow-sm"
                  : "border-border hover:border-foreground/30"
              }`}
              key={addr.id}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">
                    {addr.recipient}
                  </span>
                  {addr.isDefault && (
                    <Badge
                      className="text-3xs uppercase tracking-ui bg-primary/10 text-primary border-primary/20"
                      variant="secondary"
                    >
                      Default Address
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{addr.line1}</p>
                  {addr.line2 && <p>{addr.line2}</p>}
                  <p>
                    {addr.city}, {addr.state} —{" "}
                    <strong className="font-mono text-foreground">
                      {addr.postcode}
                    </strong>
                  </p>
                  <p className="pt-1">
                    <span className="text-2xs uppercase tracking-ui font-semibold text-muted-foreground">
                      Phone:
                    </span>{" "}
                    <span className="font-mono text-foreground">
                      {addr.phone}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-border flex items-center justify-between gap-2">
                <div>
                  {!addr.isDefault && (
                    <Button
                      className="h-7 text-3xs uppercase tracking-ui text-muted-foreground hover:text-foreground p-0"
                      disabled={isPending}
                      onClick={() => handleSetDefault(addr.id)}
                      size="sm"
                      variant="ghost"
                    >
                      Make Default
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    className="size-8 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenEdit(addr)}
                    size="sm"
                    title="Edit Address"
                    variant="ghost"
                  >
                    <PencilSimple size={16} />
                  </Button>

                  <Button
                    className="size-8 p-0 text-destructive/80 hover:text-destructive"
                    disabled={isPending}
                    onClick={() => handleDelete(addr.id)}
                    size="sm"
                    title="Delete Address"
                    variant="ghost"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
