"use client";

import { useState, useTransition } from "react";
import {
  Check,
  House,
  MapPin,
  PencilSimple,
  Plus,
  ShieldCheck,
  SpinnerGap,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  deleteAddressAction,
  saveAddressAction,
  setDefaultAddressAction,
} from "@/app/actions/addresses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface SavedAddress {
  id: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postcode: string;
  countryCode: string;
  isDefault: boolean;
  createdAt: Date;
}

export function AddressManager({ initialAddresses }: { initialAddresses: SavedAddress[] }) {
  const [addresses, setAddresses] = useState<SavedAddress[]>(initialAddresses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
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
    if (!confirm("Are you sure you want to remove this delivery address?")) return;

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
          <h2 className="text-xl font-bold tracking-tight">Saved Delivery Addresses</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your saved delivery destinations for fast, 1-click checkout.
          </p>
        </div>

        {!isFormOpen && (
          <Button onClick={handleOpenCreate} size="sm" className="h-9 gap-1.5 text-xs font-bold uppercase tracking-ui">
            <Plus size={16} weight="bold" /> Add New Address
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
          <WarningCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add / Edit Form Modal / Panel */}
      {isFormOpen && (
        <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold uppercase tracking-ui text-foreground">
              {editingAddress ? "Edit Delivery Address" : "Add New Delivery Address"}
            </h3>
            <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 text-xs">
              Cancel
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Full Name / Recipient <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Priya Sharma"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  10-Digit Mobile Number <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                Flat, House no., Building, Apartment <span className="text-destructive">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Flat 302, Palm Heights"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                Area, Street, Sector, Landmark (Optional)
              </label>
              <Input
                placeholder="e.g. Near HDFC Bank, Mindspace"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  PIN Code <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 400064"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Town / City <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  State <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="size-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-muted-foreground font-medium">
                Set as default delivery address for future orders
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={resetForm} className="text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                size="sm"
                className="gap-2 text-xs font-bold uppercase tracking-ui"
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
            <h3 className="text-sm font-bold text-foreground">No Saved Addresses</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Add your delivery addresses to speed through checkout on future purchases.
            </p>
          </div>
          <Button onClick={handleOpenCreate} size="sm" className="text-xs font-bold uppercase tracking-ui">
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-2xl border p-5 bg-card flex flex-col justify-between transition-all ${
                addr.isDefault ? "border-primary/50 shadow-sm" : "border-border hover:border-foreground/30"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{addr.recipient}</span>
                  {addr.isDefault && (
                    <Badge variant="secondary" className="text-3xs uppercase tracking-ui bg-primary/10 text-primary border-primary/20">
                      Default Address
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{addr.line1}</p>
                  {addr.line2 && <p>{addr.line2}</p>}
                  <p>
                    {addr.city}, {addr.state} — <strong className="font-mono text-foreground">{addr.postcode}</strong>
                  </p>
                  <p className="pt-1">
                    <span className="text-2xs uppercase tracking-ui font-semibold text-muted-foreground">Phone:</span>{" "}
                    <span className="font-mono text-foreground">{addr.phone}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-border flex items-center justify-between gap-2">
                <div>
                  {!addr.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(addr.id)}
                      disabled={isPending}
                      className="h-7 text-3xs uppercase tracking-ui text-muted-foreground hover:text-foreground p-0"
                    >
                      Make Default
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(addr)}
                    className="size-8 p-0 text-muted-foreground hover:text-foreground"
                    title="Edit Address"
                  >
                    <PencilSimple size={16} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(addr.id)}
                    disabled={isPending}
                    className="size-8 p-0 text-destructive/80 hover:text-destructive"
                    title="Delete Address"
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
