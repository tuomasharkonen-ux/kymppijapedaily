import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

interface GameRecord {
  throws_count: number;
  winning_number: number;
  played_date: string;
}

interface ResultsPanelProps {
  todayResult: GameRecord | null;
  personalBest: number | null;
  favoriteNumber: number | null;
  isLoading: boolean;
}

export const ResultsPanel = ({ 
  todayResult, 
  personalBest, 
  favoriteNumber,
  isLoading 
}: ResultsPanelProps) => {
  const copyToClipboard = () => {
    if (!todayResult) return;

    const today = format(new Date(), "dd.MM.yyyy");
    const diceEmojis = "🎲".repeat(todayResult.throws_count);
    
    const shareText = `Kymppijape daily ${today}
Throws today: ${todayResult.throws_count} ${diceEmojis}
Personal best: ${personalBest || todayResult.throws_count}`;

    navigator.clipboard.writeText(shareText).then(() => {
      toast.success("Copied to clipboard!", {
        description: "Share your result with friends!",
      });
    }).catch(() => {
      toast.error("Failed to copy");
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          📊 Your Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {todayResult ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-accent/50 rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold text-primary">
                  {todayResult.throws_count}
                </p>
                <p className="text-xs text-muted-foreground">throws</p>
              </div>
              <div className="bg-accent/50 rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground">Best Ever</p>
                <p className="text-2xl font-bold text-primary">
                  {personalBest || "-"}
                </p>
                <p className="text-xs text-muted-foreground">throws</p>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground">Today's number</p>
              <p className="text-3xl font-bold">{todayResult.winning_number}</p>
            </div>

            {favoriteNumber && (
              <div className="bg-card border rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground">Your favorite number</p>
                <p className="text-3xl font-bold text-primary">{favoriteNumber} ⭐</p>
                <p className="text-xs text-muted-foreground">Most used across all games</p>
              </div>
            )}

          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Play today's game to see your stats!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {personalBest 
                ? `Your best: ${personalBest} throws` 
                : "No games played yet"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
