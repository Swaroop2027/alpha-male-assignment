import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export const useUtm = () => {
  const location = useLocation();
  const [utm, setUtm] = useState(() => {
    const saved = sessionStorage.getItem("alpha_utm");
    return saved
      ? JSON.parse(saved)
      : {
          source: "direct",
          medium: "none",
          campaign: "none",
          term: "",
          content: "",
          landingPage: "/",
        };
  });

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const utmSource = query.get("utm_source");
    const utmMedium = query.get("utm_medium");
    const utmCampaign = query.get("utm_campaign");
    const utmTerm = query.get("utm_term");
    const utmContent = query.get("utm_content");

    if (utmSource || utmCampaign) {
      const capturedUtm = {
        source: utmSource || "direct",
        medium: utmMedium || "none",
        campaign: utmCampaign || "none",
        term: utmTerm || "",
        content: utmContent || "",
        landingPage: location.pathname,
      };
      sessionStorage.setItem("alpha_utm", JSON.stringify(capturedUtm));
      setUtm(capturedUtm);
    }
  }, [location]);

  return utm;
};
