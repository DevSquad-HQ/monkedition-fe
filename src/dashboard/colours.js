// The colour codes the catalog and Qikink SKUs use (catalog/domain/colours.js).
export const COLOURS = [
  ["Bk", "Black", "#000000"], ["Wh", "White", "#ffffff"], ["Yl", "Yellow", "#facc15"],
  ["BB", "Baby Blue", "#87ceeb"], ["SG", "Steel Grey", "#9ca3af"], ["Sb", "Sky Blue", "#38bdf8"],
  ["Rb", "Royal Blue", "#2563eb"], ["Rd", "Red", "#ef4444"], ["Pu", "Purple", "#a855f7"],
  ["pb", "Petrol Blue", "#0c5678"], ["Ph", "Peach", "#fed7aa"], ["or", "Orange", "#f97316"],
  ["OG", "Olive Green", "#3d550c"], ["NYI", "Neon Yellow", "#fde047"], ["Nb", "Navy Blue", "#1e40af"],
  ["MYI", "Mustard Yellow", "#ca8a04"], ["Mh", "Mocha", "#a8a29e"], ["Mnt", "Mint", "#bbf7d0"],
  ["Mn", "Maroon", "#7f1d1d"], ["LBp", "Light Baby Pink", "#fbcfe8"], ["Lv", "Lavender", "#e9d5ff"],
  ["Jd", "Jade", "#34d399"], ["Gm", "Grey Melange", "#d1d5db"], ["GYI", "Golden Yellow", "#f59e0b"],
  ["Fgn", "Flag Green", "#16a34a"], ["Cor", "Coral", "#f08080"], ["Cop", "Copper", "#d97706"],
  ["bn", "Brown", "#431407"], ["Cm", "Charcoal Melange", "#4b5563"], ["BRd", "Brick Red", "#b91c1c"],
  ["Gn", "Bottle Green", "#065f46"], ["Be", "Beige", "#fef3c7"], ["Fl", "Flamingo", "#ec4899"],
].map(([code, name, hex]) => ({ code, name, hex }));

export const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
