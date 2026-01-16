import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GameRecord {
  throws_count: number;
  winning_number: number;
  played_date: string;
}

interface ResultsPanelProps {
  todayResult: GameRecord | null;
  personalBest: number | null;
  personalWorst: number | null;
  averageThrows: number | null;
  favoriteNumber: number | null;
  currentStreak: number;
  rankByAverage: number | null;
  rankByBest: number | null;
  totalPlayers: number | null;
  gamesPlayed: number;
  isLoading: boolean;
}

export const ResultsPanel = ({ 
  todayResult, 
  personalBest,
  personalWorst,
  averageThrows,
  favoriteNumber,
  currentStreak,
  rankByAverage,
  rankByBest,
  totalPlayers,
  gamesPlayed,
  isLoading 
}: ResultsPanelProps) => {
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
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-accent/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-2xl font-bold text-primary">
                  {todayResult.throws_count}
                </p>
                <p className="text-xs text-muted-foreground">throws</p>
              </div>
              <div className="bg-accent/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Best</p>
                <p className="text-2xl font-bold text-primary">
                  {personalBest || "-"}
                </p>
                <p className="text-xs text-muted-foreground">throws</p>
              </div>
              <div className="bg-accent/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Worst</p>
                <p className="text-2xl font-bold text-destructive">
                  {personalWorst || "-"}
                </p>
                <p className="text-xs text-muted-foreground">throws</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-accent/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Average</p>
                <p className="text-2xl font-bold text-primary">
                  {averageThrows || "-"}
                </p>
                <p className="text-xs text-muted-foreground">throws</p>
              </div>
              <div className="bg-accent/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Games</p>
                <p className="text-2xl font-bold text-primary">
                  {gamesPlayed}
                </p>
                <p className="text-xs text-muted-foreground">played</p>
              </div>
              <div className="bg-accent/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold text-primary">
                  {currentStreak}
                </p>
                <p className="text-xs text-muted-foreground">🔥 days</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Rank (Best)</p>
                <p className="text-2xl font-bold">
                  {rankByBest && totalPlayers ? `#${rankByBest}` : "-"}
                  {rankByBest === 1 && " 🏆"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totalPlayers ? `of ${totalPlayers} players` : ""}
                </p>
              </div>
              <div className="bg-card border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Rank (Avg)</p>
                <p className="text-2xl font-bold">
                  {rankByAverage && totalPlayers ? `#${rankByAverage}` : "-"}
                  {rankByAverage === 1 && " 🏆"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totalPlayers ? `of ${totalPlayers} players` : ""}
                </p>
              </div>
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
