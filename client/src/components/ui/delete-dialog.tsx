import { ReactNode } from 'react';
import { CustomDialog, DialogFooterContainer } from './custom-dialog';
import { DialogHeaderWithIcon } from './dialog-header-with-icon';
import { Button } from './button';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { Trash2 } from 'lucide-react';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  item?: {
    name: string;
    id?: string;
    photoUrl?: string;
    initials?: string;
  };
  warningText?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

export function DeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isLoading = false,
  item,
  warningText = "Deze actie kan niet ongedaan worden gemaakt.",
  confirmButtonText = "Verwijderen",
  cancelButtonText = "Annuleren"
}: DeleteDialogProps) {
  return (
    <CustomDialog open={open} onOpenChange={onOpenChange}>
      <DialogHeaderWithIcon 
        title={title}
        description={description}
        icon={<Trash2 className="h-5 w-5 text-white" />}
      />
      
      <div className="px-6 py-4">
        {item && (
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-gray-200">
                {item.photoUrl ? (
                  <AvatarImage src={item.photoUrl} alt={item.name} />
                ) : (
                  <AvatarFallback className="bg-[#1e40af] text-white">
                    {item.initials || item.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="font-medium">{item.name}</p>
                {item.id && (
                  <p className="text-xs text-gray-500">{item.id}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        <p className="text-sm text-gray-600 mb-6">{warningText}</p>
        
        <DialogFooterContainer>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-300"
            disabled={isLoading}
          >
            {cancelButtonText}
          </Button>
          <Button 
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
            )}
            {confirmButtonText}
          </Button>
        </DialogFooterContainer>
      </div>
    </CustomDialog>
  );
}