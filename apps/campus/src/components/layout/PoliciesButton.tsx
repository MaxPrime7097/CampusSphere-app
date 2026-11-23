import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CaretDown } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function PoliciesButton() {
  const { t } = useTranslation("navigation");
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="font-poppins bg-[#ff9800] hover:bg-[#f57c00] text-white text-sm font-semibold px-5 py-2.5 rounded-full gap-2 h-auto transition-colors">
          {t("policies")}
          <CaretDown size={15} weight="bold" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="font-nunito font-medium">
        <DropdownMenuItem onClick={() => navigate("/cs/policies/privacy")}>
          {t("privacyPolicy")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/cs/policies/terms")}>
          {t("termsOfService")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/cs/policies/terms-of-sale")}>
          {t("termsOfSale")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/cs/policies/legal-notice")}>
          {t("legalNotice")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/cs/policies/community-guidelines")}>
          {t("communityGuidelines")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/cs/policies/cookiepolicy")}>
          {t("cookiePolicy")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/cs/policies/copyright")}>
          {t("copyright")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/cs/policies/datadeletion")}>
          {t("dataDeletion")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
