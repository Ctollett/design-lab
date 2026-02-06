interface Product {
    name: string,
    price: string,
    brand: string,
    color: string
}


export const productMap: Record<string, Product> = {
  "couch": {
    name: "Modern Sectional Sofa",
    price: "$1,299",
    brand: "West Elm",
    color: "rgba(120, 113, 98, 0.75)"
  },
  "light": {
    name: "Arc Floor Lamp",
    price: "$249",
    brand: "CB2",
    color: "rgba(30, 30, 30, 0.75)"
  },
  "potted plant": {
    name: "Fiddle Leaf Fig",
    price: "$89",
    brand: "The Sill",
    color: "rgba(76, 120, 60, 0.75)"
  },
  "book": {
    name: "Coffee Table Book Set",
    price: "$45",
    brand: "Taschen",
    color: "rgba(139, 90, 60, 0.75)"
  },
  "cup": {
    name: "Ceramic Mug",
    price: "$24",
    brand: "Heath Ceramics",
    color: "rgba(45, 45, 45, 0.75)"
  }
}