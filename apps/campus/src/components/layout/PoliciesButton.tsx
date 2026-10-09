import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from "@/components/ui/button";
import { CaretDown as ChevronDown } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function PoliciesButton(){
  const { t } = useTranslation("navigation");
  const navigate = useNavigate();
  
    return (
     <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            className="font-poppins campus-gradient text-white hover:opacity-90 text-lg px-8 py-8 rounded-lg transition-all duration-300 hover:scale-105"
          >
            {t("policies")}
            <ChevronDown className="h-4 w-4 "/>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="font-nunito font-semibold">
          <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/privacy')}>
            {t("privacyPolicy")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/terms')}>
            {t("termsOfService")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/terms-of-sale')}>
            {t("termsOfSale")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/legal-notice')}>
            {t("legalNotice")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/community-guidelines')}>
            {t("communityGuidelines")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/cookiepolicy')}>
            {t("cookiePolicy")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/copyright')}>
            {t("copyright")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/datadeletion')}>
            {t("dataDeletion")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }