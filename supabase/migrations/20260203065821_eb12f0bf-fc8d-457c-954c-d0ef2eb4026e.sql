-- Add Action Hero badge (won using shake or blow action)
INSERT INTO badges (id, name, description, trigger_type, trigger_value, prize_credits, rarity)
VALUES ('action_hero', 'Action Hero', 'Win a game using a shake or blow action', 'action_win', NULL, 50, 'Uncommon');