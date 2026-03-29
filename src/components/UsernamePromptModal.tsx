 import { useState } from "react";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { toast } from "sonner";
 
 interface UsernamePromptModalProps {
   isOpen: boolean;
   onComplete: (username: string) => Promise<{ success: boolean; error?: string }>;
 }
 
 export const UsernamePromptModal = ({ isOpen, onComplete }: UsernamePromptModalProps) => {
   const [username, setUsername] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setError(null);
     setIsLoading(true);
 
     const result = await onComplete(username);
     
     if (result.success) {
       toast.success("Username set! You're ready to play.");
     } else {
       setError(result.error || "Failed to set username");
     }
     
     setIsLoading(false);
   };
 
   return (
     <Dialog open={isOpen}>
       <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
         <DialogHeader>
           <DialogTitle className="text-center text-xl">
             <span aria-hidden="true">👋</span> Welcome to Kymppijape!
           </DialogTitle>
           <DialogDescription className="text-center">
             Choose a username for the leaderboards. This is how other players will see you!
           </DialogDescription>
         </DialogHeader>
         
         <form onSubmit={handleSubmit} className="space-y-4 pt-2">
           <div className="space-y-2">
             <Label htmlFor="username">Username</Label>
             <Input
               id="username"
               type="text"
               placeholder="DiceMaster123"
               value={username}
               onChange={(e) => {
                 setUsername(e.target.value);
                 setError(null);
               }}
               className={error ? "border-destructive" : ""}
               autoFocus
               required
               minLength={3}
               maxLength={20}
             />
             {error && (
               <p className="text-sm text-destructive">{error}</p>
             )}
             <p className="text-xs text-muted-foreground">
               3-20 characters. Letters, numbers, and underscores only.
             </p>
           </div>
           
           <Button type="submit" className="w-full" disabled={isLoading || username.length < 3}>
             {isLoading ? "Setting username..." : "Let's Roll! 🎲"}
           </Button>
         </form>
       </DialogContent>
     </Dialog>
   );
 };