type ProductVisualProps = {
  seed: string;
  size?: "card" | "large" | "thumb";
};

const visualPalettes = [
  {
    shell: "from-[#DCE7EC] via-white to-[#BFD0D8]",
    ring: "border-[#1F2933]/85",
    center: "bg-[#0B5CAD]/85",
  },
  {
    shell: "from-[#E8EDF0] via-white to-[#C9D6DD]",
    ring: "border-[#24364A]/85",
    center: "bg-[#16803C]/85",
  },
  {
    shell: "from-[#E5EAF0] via-white to-[#CAD7E2]",
    ring: "border-[#263849]/85",
    center: "bg-[#0F766E]/85",
  },
  {
    shell: "from-[#E9EEF3] via-white to-[#D7DEE7]",
    ring: "border-[#1F2933]/80",
    center: "bg-[#B7791F]/85",
  },
];

const sizes = {
  card: "h-24 w-28",
  large: "h-64 w-64",
  thumb: "h-14 w-16",
};

const ringWidths = {
  card: "border-[10px]",
  large: "border-[16px]",
  thumb: "border-[6px]",
};

export function ProductVisual({ seed, size = "card" }: ProductVisualProps) {
  const palette = visualPalettes[hashSeed(seed) % visualPalettes.length];

  return (
    <div
      aria-hidden="true"
      className={`relative ${sizes[size]} rounded-full bg-gradient-to-br ${palette.shell} shadow-inner`}
    >
      <div
        className={`absolute left-1/2 top-1/2 h-[56%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full ${ringWidths[size]} ${palette.ring} bg-white shadow-lg`}
      />
      <div
        className={`absolute left-1/2 top-1/2 h-[30%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full ${palette.center}`}
      />
      <div className="absolute bottom-[18%] left-[18%] h-3 w-[64%] rounded-full bg-[#1F2933]/15 blur-sm" />
    </div>
  );
}

function hashSeed(value: string) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0);
}
