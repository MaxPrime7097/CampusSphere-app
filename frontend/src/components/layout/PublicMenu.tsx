import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";

export function PublicMenu() {
  const navigate = useNavigate(); 
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <span className="relative h-10 w-10 rounded-full p-0 hover:bg-accent cursor-pointer"><Menu className="h-4 w-4" /></span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="font-nunito font-semibold w-56" align="end" forceMount>
        <DropdownMenuItem 
          onClick={() => navigate("/cs-inc/about")}
          className="cursor-pointer"
        >
          <span>À propos</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate("/cs-inc/contact")}
          className="cursor-pointer"
        >
          <span>Contact</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate("/cs-inc/faq")}
          className="cursor-pointer"
        >
          <span>FAQ</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate("/cs-inc/policies")}
          className="cursor-pointer"
        >
          <span>Politiques</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="mb-1" />
        <DropdownMenuItem 
          onClick={() => navigate("/register")}
          className="cursor-pointer "
        >
          <span className="text-primary">Rejoindre la communauté</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate("/login")}
          className="cursor-pointer"
        >
          <span className="text-primary">Se connecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
