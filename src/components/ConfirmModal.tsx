import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default" | "warning";
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "destructive",
  loading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          iconClass: "text-red-400 bg-red-500/10 border-red-500/20",
          btnClass: "bg-red-600 hover:bg-red-500 text-white",
        };
      case "warning":
        return {
          iconClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
          btnClass: "bg-amber-600 hover:bg-amber-500 text-white",
        };
      default:
        return {
          iconClass: "text-blue-400 bg-blue-500/10 border-blue-500/20",
          btnClass: "bg-blue-600 hover:bg-blue-500 text-white",
        };
    }
  };

  const { iconClass, btnClass } = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <Card className="max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl border ${iconClass} shrink-0`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground m-0">{title}</h3>
            <div className="text-xs text-muted-foreground leading-relaxed m-0">
              {description}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={loading}
            onClick={onConfirm}
            className={`${btnClass} gap-2`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
          </Button>
        </div>
      </Card>
    </div>
  );
};
