import type { Message } from '../domain/types';

type SeedEntry = [sender: string, text: string];

function buildThread(contactId: string, entries: SeedEntry[]): Message[] {
  const now = Date.now();
  return entries.map(([sender, text], index) => ({
    id: `${contactId}-seed-${index}`,
    threadId: contactId,
    sender,
    text,
    timestamp: now - (entries.length - index) * 60_000,
    status: 'sent',
  }));
}

export const seedMessagesByContact: Record<string, Message[]> = {
  raven: buildThread('raven', [
    ['me', 'hey you around?'],
    ['raven', "unfortunately yes — what's up"],
    ['me', "just replaying that thing from earlier, can't tell if it was actually weird or if i'm just tired"],
    ['raven', "it was weird — i watched you walk into a doorframe over it, that's not a tired person, that's a haunted person"],
    ['me', 'rude but fair'],
    ['raven', "i'm never wrong about this stuff — it's the one thing i have going for me, well that and making everything sound like a bigger deal than it is, which, arguably, is happening right now"],
    ['me', "see, you're doing the thing"],
    ['raven', "i'm always doing the thing 🖤"],
  ]),

  nova: buildThread('nova', [
    ['me', 'you still up for tomorrow?'],
    ['nova', 'yes'],
    ['nova', 'wait'],
    ['nova', 'what time'],
    ['me', 'like 2pm?'],
    ['nova', 'perfect'],
    ['nova', "cant wait"],
    ['nova', 'bringing snacks'],
  ]),

  juno: buildThread('juno', [
    ['me', 'how was the concert??'],
    ['juno', 'OMG 🎤✨ it was INSANE 😭💗 i cried like 3 times 🥹'],
    ['juno', '🎶🎶🎶'],
    ['me', 'no way, which songs'],
    ['juno', 'the encore literally broke me 💔➡️💖'],
  ]),

  priya: buildThread('priya', [
    ['me', 'can you help me plan the trip?'],
    ['priya', 'Sure — here\'s what we need to lock down:\n1. Flights\n2. Hotel\n3. Car rental\n4. Itinerary for day 1'],
    ['me', "let's start with flights"],
    ['priya', 'You said "let\'s start with flights" — good call, those get expensive fastest. Do mornings or evenings work better for you?'],
  ]),
};
