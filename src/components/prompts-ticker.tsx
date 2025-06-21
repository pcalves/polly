import React from "react";

const prompts = [
  "Why do parrots repeat everything?",
  "Can you teach me a magic trick?",
  "Write me a haiku about coffee",
  "Help me understand blockchain without the hype",
  "What makes a good password in 2025?",
  "Explain why my code works but I don't know how",
  "How do I know if my plant is happy?",
  "What actually happens when I clear cookies?",
  "Teach me something surprising about octopuses",
  "Why is my sourdough starter named Kevin acting weird?",
  "Can parrots actually understand what they're saying?",
  "What's the deal with airline food? (but actually)",
  "How do I explain my job to my grandma?",
  "Create a workout routine for someone who hates working out",
  "Why do all my meetings feel like they could've been emails?",
  "Is a hot dog a sandwich? Defend your answer",
  "Tell me a fun fact that'll make me seem smart at parties",
  "What should I name my pet parrot?",
  "Why do cats purr and dogs don't?",
  "How do I start a conversation with my crush?",
  "What's the weirdest law in your country?",
  "Can you explain quantum physics like I'm five?",
  "Why do we say 'break a leg' for good luck?",
  "What would happen if gravity stopped working for 5 minutes?",
  "How do I make friends as an adult?",
  "Why does time feel like it goes faster as we age?",
  "What's the most useless superpower you can think of?",
  "How do I stop procrastinating right now?",
  "Why do we dream and forget most of them?",
  "What's the best way to learn a new language?",
  "How do I know if I'm in love or just hungry?",
  "Why do some people hate the sound of nails on chalkboard?",
  "What would aliens think of our social media?",
  "How do I become a morning person without dying?",
  "Why do we get songs stuck in our heads?",
  "What's the psychology behind why we love gossip?",
  "How do I stop my cat from judging my life choices?",
  "Why do we feel nostalgia for times we never lived?",
  "What's the most romantic programming language?",
  "How do I survive a zombie apocalypse with just office supplies?",
  "Why do we say 'you too' when the waiter says 'enjoy your meal'?",
  "What's the best conspiracy theory that's probably true?",
  "How do I explain cryptocurrency to my mom?",
  "Why do we park in driveways and drive on parkways?",
  "What would happen if everyone suddenly became honest?",
  "How do I make my houseplants stop dying?",
  "Why do we feel embarrassed about things we did years ago?",
  "What's the most ridiculous fashion trend in history?",
  "How do I know if my WiFi has trust issues?",
  "Why do we call it 'rush hour' when nobody's moving?",
  "What would be the worst superpower to have?",
  "How do I become friends with my neighbor's dog?",
  "Why do we say 'after dark' when it's actually after light?",
  "What's the most useless piece of advice that's actually brilliant?",
  "How do I stop my phone from listening to my thoughts?",
  "Why do we feel guilty about taking naps?",
  "What would happen if colors had sounds?",
  "How do I make small talk with introverts?",
  "Why do we call it a 'building' when it's already built?",
  "What's the most creative excuse for being late?",
  "How do I convince my pet they're not the boss of me?",
];

export function PromptsTicker({
  onQuickPrompt,
}: {
  onQuickPrompt: (prompt: string) => void;
}) {
  // Use a deterministic shuffle to avoid hydration mismatches
  const shuffledPrompts = React.useMemo(() => {
    // Create a deterministic seed based on the prompts length
    const seed = prompts.length;
    const shuffled = [...prompts];

    // Simple deterministic shuffle using a fixed seed
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (seed * (i + 1)) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }, []);

  const createPromptRows = () => {
    const rowCount = 3;
    const rows = [];
    const promptsPerRow = 8;
    for (let i = 0; i < rowCount; i++) {
      const startIndex = (i * promptsPerRow) % shuffledPrompts.length;
      const rowPrompts = [];
      for (let j = 0; j < promptsPerRow; j++) {
        const promptIndex = (startIndex + j) % shuffledPrompts.length;
        rowPrompts.push(shuffledPrompts[promptIndex]);
      }
      rows.push(rowPrompts);
    }
    return rows;
  };

  const promptRows = createPromptRows();

  const colorConfigs = [
    {
      bg: "bg-accent-coral/10 dark:bg-accent-coral/15",
      border: "border-accent-coral/30",
      hover:
        "hover:bg-accent-coral/15 dark:hover:bg-accent-coral/20 hover:border-accent-coral/50",
    },
    {
      bg: "bg-accent-blue/10 dark:bg-accent-blue/15",
      border: "border-accent-blue/30",
      hover:
        "hover:bg-accent-blue/15 dark:hover:bg-accent-blue/20 hover:border-accent-blue/50",
    },
    {
      bg: "bg-accent-coral/10 dark:bg-accent-coral/15",
      border: "border-accent-coral/30",
      hover:
        "hover:bg-accent-coral/15 dark:hover:bg-accent-coral/20 hover:border-accent-coral/50",
    },
    {
      bg: "bg-accent-yellow/10 dark:bg-accent-yellow/15",
      border: "border-accent-yellow/30",
      hover:
        "hover:bg-accent-yellow/15 dark:hover:bg-accent-yellow/20 hover:border-accent-yellow/50",
    },
    {
      bg: "bg-accent-purple/10 dark:bg-accent-purple/15",
      border: "border-accent-purple/30",
      hover:
        "hover:bg-accent-purple/15 dark:hover:bg-accent-purple/20 hover:border-accent-purple/50",
    },
    {
      bg: "bg-accent-orange/10 dark:bg-accent-orange/15",
      border: "border-accent-orange/30",
      hover:
        "hover:bg-accent-orange/15 dark:hover:bg-accent-orange/20 hover:border-accent-orange/50",
    },
  ];

  return (
    <div className="py-6">
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
      <div className="space-y-4 relative">
        {promptRows.map((rowPrompts, rowIndex) => {
          const duplicatedPrompts = [...rowPrompts, ...rowPrompts];
          return (
            <div
              key={rowIndex}
              className={`ticker-row ${rowIndex % 2 === 0 ? "ticker-row-left" : "ticker-row-right"}`}
              style={{
                transform: `translateX(${rowIndex % 2 === 0 ? `${-rowIndex * 20}vw` : `${rowIndex * 20}vw`})`,
              }}
            >
              {duplicatedPrompts.map((prompt, promptIndex) => {
                const colorConfig =
                  colorConfigs[
                    (rowIndex * 8 + promptIndex) % colorConfigs.length
                  ];
                return (
                  <button
                    key={`${rowIndex}-${promptIndex}`}
                    type="button"
                    className={`flex-shrink-0 h-auto px-4 py-3 text-left whitespace-nowrap hover:shadow-lg transition-all duration-300 ${colorConfig.bg} ${colorConfig.border} ${colorConfig.hover} hover:scale-105 hover:z-10 relative group rounded-md border`}
                    onClick={() => onQuickPrompt(prompt)}
                    style={{ minWidth: "fit-content" }}
                  >
                    <span className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors">
                      {prompt}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
