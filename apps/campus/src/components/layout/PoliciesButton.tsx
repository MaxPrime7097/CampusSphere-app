import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from "@/components/ui/button";
import { CaretDown as ChevronDown } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function PoliciesButton(){
  const navigate = useNavigate();
  
    return (
     <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            className="font-poppins campus-gradient text-white hover:opacity-90 text-lg px-8 py-8 rounded-lg transition-all duration-300 hover:scale-105"
          >
            Politiques
            <ChevronDown className="h-4 w-4 "/>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="font-nunito font-semibold">
          <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/privacy')}>
            Politique de Confidentialité
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/terms')}>
            Conditions d'Utilisation
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/terms-of-sale')}>
            Conditions de Vente (CGV)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/legal-notice')}>
            Mentions Légales
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/community-guidelines')}>
            Règles de la Communauté
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/cookiepolicy')}>
            Politique de Cookies
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/copyright')}>
            Politique de Droits d'auteur
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/datadeletion')}>
            Suppression des Données
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }