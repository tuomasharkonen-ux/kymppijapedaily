import { MokkiPreview } from "@/components/mokki/MokkiPreview";
import { BettingPreview } from "@/components/vedot/BettingPreview";

export const FeaturePreview = ({ featureId }: { featureId: string }) => {
  if (featureId === "betting_license") return <BettingPreview />;
  if (featureId === "mokki_plot") return <MokkiPreview />;
  return null;
};
