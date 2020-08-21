-- | Write a report describing your design and strategy here.
-- The strategy is used for the decision making is that I try to minimize loss for the player. There are a few ways to minimize loss of the player:
-- 1) Lead with biggest card that is a non-Heart card, King of Spades, Queen of Spades or Ace of Spades in the early rounds. This move is made because in
--    the early rounds the opponent will very likely have cards that match the suit so throwing big cards won't have an effect on winning points and will
--    decrease the chances of winning subsequent tricks.
-- 2) In the early rounds if the leader suit is not Heart or Spade, throw the biggest card in hand that matches the leader suit because the risk of winning 
--    points in the early game is fairly low. 
-- 3) Lead with smallest card in hand in later rounds to minimise the chances of winning the trick, we want to avoid winning if possible because winning 
--    accumulates score and we want to avoid that.
-- 4) Play card with biggest rank in hand when there is no card in hand that matches leader suit. This move is made because only cards that match the leader 
--    suit will be compared against each other, whoever has the greatest score that matches the leader suit will win the trick and take all the cards,
--    hence if we play the biggest card in hand we can reduce chances of winning a trick in later tricks.
-- 5) In later rounds, play the biggest in hand that is smaller than the leader card if possible, this move will guarantee the player does not win the trick and reduce the 
--    chances of winning later tricks because the cards with bigger rank are played first.
-- 6) If all cards that match the leader suit are bigger than the rank of the leader card, play smallest card that matches the leader suit, again this move
--    can reduce the chance of winning the trick because other players might have cards that are bigger than my player.
-- To implement these rules into Player.hs, I decided to use the heuristic player. The information I save in the memory is the current trick which will
-- influence the decision making depending on the number of cards left. 
-- In the lead function, I try to play the biggest card that is a non-Heart, not a King of Spades, Queen of Spades and Ace of Spades in the first five rounds. 
-- In the later rounds, I try to lead with the smallest card in hand if possible. If all of the above condition fails, the player will lead with the 
-- smallest non-heart card. 
-- In the renege function, the player will match the leader suit if there are still cards with same suit as leader, however the player will try to play
-- the biggest card that matches the leader suit in the early rounds. However the player will not play the Queen of Spades if the leader rank is 
-- smaller than Queen. In the later rounds, the player will try to play the biggest card in hand that is still smaller than the leader suit. If all of the
-- conditions are not met, the player will simply play the smallest card that matches the leader suit.
-- If there are no cards that match the leader suit, the player will try to play the Queen of Spades if its available and its
-- not the first trick. If there is no Queen of Spades and not the first trick, the player will try to play King of Spades or Ace of Spades if available. 
-- If its not the first trick, the player will attempt to play the biggest card regardless of suit. If its the first trick, the player will play the
-- biggest non-point card. To implement the design, I used a combination of guards and branching. The branching is used to determine whether there is a 
-- Two of Clubs in the lead function, and to determine whether there is a card that matches a leader suit in the player's hand in the renege function.
-- The rest of the decision making is handled by guards.
module Player (
    playCard,
    makeBid
)
where

-- You can add more imports as you need them.
import Cards
import Data.Maybe
import Data.List
import Hearts.Types

-- Nicholas: You need to read Types.hs and Cards.hs at minimum to start doing things.
-- Play.hs contains the sequence of play for every round, but it's not necessary to fully understand it.
-- You only need to know how the game works, and you just need to play a single card, everything else is automated.
-- The problem is choosing the right card to play. This is what you'll need to solve.

playCard :: PlayFunc
-- Empty trick list means beginning of trick. I have to lead.
playCard _ hand [] memory = (lead hand (get_trick memory),change_trick (get_trick memory))
-- Trick list is not empty, so it means someone already played. I must renege.
playCard _ hand trick memory = (renege (fst $ last trick ) hand (get_trick memory) , change_trick (get_trick memory))

-- | The renege function takes in a leader suit and selects the first occuring card of that suit from a list of cards.
renege :: Card ->[Card] -> String -> Card 
renege leader hand current_trick = select (find (\x -> suit x == suit leader)hand) where
    select :: Maybe Card -> Card
    --Select biggest card in hand if no cards match the leader suit
    select Nothing
     --Play Queen of Spades first to prevent accumulating score, it works by checking whether its the First Round by inspecting the memory string.
     --If its not the First Round it will play the Queen of Spades because the Bleeding Rule is already satisfied 
     | current_trick/="First trick" && filter (\x -> suit x == Spade && rank x == Queen) hand/=[]
     = head $filter (\x -> suit x == Spade && rank x == Queen)hand 
     --If the player doesn't have Queen of Spades, check whether the player has King of Spades or Ace of Spades.
     | current_trick/="First trick" && filter (\x -> suit x == Spade && rank x > Queen) hand/=[]
     = maximum $filter (\x -> suit x == Spade && rank x > Queen)hand 
     --Play biggest card in hand if there are no cards matching leader suit, it does so by checking whether its the First Round through the information in the memory string.
     --If it is not the first round, play biggest the card in hand
     | current_trick /="First trick" = maximum$ hand
     --If it is still in the first round, play biggest non-point cards first to satisfy the bleeding rule
     | otherwise= maximum$not_heart$filter_q hand 
     
    select _
     | suit leader/=Spade && suit leader/=Heart
     = maximum$filter (\x -> suit x == suit leader)hand
     -- Do not play Queen of Spades if the leader suit is Spades and Queen of Spades is on hand.
     | suit leader==Spade && find (\x -> suit x == suit leader && rank x==Queen)hand /= Nothing && filter(\x -> suit x == suit leader&& rank x/=Queen)hand/=[]
     = maximum$filter(\x -> suit x == suit leader&& rank x/=Queen)hand
     -- Play biggest spade card available if the leader card is not Queen of Spades and Queen of Spades is not on hand
     | suit leader==Spade && rank leader/=Queen && find (\x -> suit x == suit leader && rank x==Queen)hand == Nothing && 
     filter(\x -> suit x == suit leader)hand/=[]= maximum$filter(\x -> suit x == suit leader )hand
    --Play biggest card in hand that matches the leader suit and is smaller than leader rank.
    --This statement works by checking whether there are cards that match the leader suit and is smaller.
     | filter (\x -> suit x == suit leader&& rank x < rank leader)hand /=[]= maximum$filter (\x -> suit x == suit leader&& rank x < rank leader)hand
    --If all of the above fail, play the smallest card in the hand that matches the leader suit.
     | otherwise = minimum$match_suit hand (suit leader)


-- | The lead function is for the start of the trick. It always tries to choose 2 of clubs if I have it.
lead :: [Card] ->String -> Card
lead hand current_trick= select (find (== (Card Club Two))hand) where
    -- | Select two of clubs if its available, otherwise lead with smallest non-heart card
    select :: Maybe Card -> Card
    select Nothing 
    -- lead with biggest non-heart card that is not a King of Spades, Queen of Spades or Ace of Spades in the early tricks
     | not_heart hand /=[] && current_trick/="Rest of game"=  maximum$filter_kqa$not_heart hand
    -- Select smallest heart if there are no other existing non-Heart cards
     | not_heart hand ==[] = minimum$match_suit hand Heart
    --Select smallest card in deck that is a non-heart card to lead to minimize chances of accumulating score and satisfy the breaking rule.
     | otherwise = minimum(not_heart hand)
    --If there is 2 of clubs in hand play two of clubs
    select card = fromJust card

-- | Update the trick to the next trick until the round reaches the Fourth trick, and then the string will simply change to Rest of game. 
-- Input: "Fifth trick"
-- Output: "Rest of game"
change_trick :: String-> String
change_trick "First trick" = "Second trick"
change_trick "Second trick"= "Third trick"
change_trick "Third trick" = "Fourth trick"
change_trick _ = "Rest of game"

-- | get the memory string from memory if its not empty, if its return First trick.
-- Input: ([(Card Club Ten, 383)], "Second trick")
-- Output: "Second trick"
get_trick :: Maybe ([(Card, PlayerId)], String) -> String
get_trick Nothing = "First trick"
get_trick (Just x)= snd x


-- | Given a card, select its suit.
-- Input: Card Diamond King
-- Output: Diamond
suit :: Card -> Suit
suit (Card s _) = s

-- | Given a card, select its rank.
-- Input: Card Diamond King
-- Output: King
rank :: Card -> Rank
rank (Card _ r) = r

-- | Filter out heart cards from list, it takes the hand given and filter out cards that have a Heart suit. 
-- Input: [Card Spade Ace, Card Heart Queen, Card Diamond King, Card Spade Queen, Card Diamond Ace, Card Heart Eight ]
-- Output:[Card Spade Ace, Card Diamond King, Card Spade Queen, Card Diamond Ace]
not_heart :: [Card] -> [Card]
not_heart [] = []
not_heart hand = filter (\x -> suit x /=Heart) hand

-- |Find cards that match the suit, it takes the hand and suit given and filter out the cards that do not match the suit
-- Input: [Card Spade Ace, Card Diamond King, Card Spade Queen, Card Diamond Ace, Card Club Ten]
-- Output: [Card Club Ten]
match_suit::[Card] -> Suit -> [Card]
match_suit [] _ = []
match_suit hand s= filter(\x -> suit x == s)hand

-- | Filter out Queen of Spades from hand
-- Input: [Card Spade Ace, Card Diamond King, Card Spade Queen, Card Diamond Ace]
-- Output: [Card Spade Ace, Card Diamond King, Card Diamond Ace]
filter_q::[Card] -> [Card]
filter_q [] = []
filter_q hand = filter (\x -> suit x /=Spade|| rank x/=Queen) hand

-- | Filter out the King of Spades and Ace of Spades from hand
-- Input: [Card Spade Ace, Card Diamond King, Card Spade Queen, Card Diamond Ace]
-- Output: [Card Diamond King, Card Diamond Ace]
filter_kqa::[Card] -> [Card]
filter_kqa [] = []
filter_kqa hand = filter (\x -> suit x /=Spade||(rank x/=King && rank x/=Ace && rank x/=Queen)) hand

-- | Not used, do not remove.
makeBid :: BidFunc
makeBid = undefined
