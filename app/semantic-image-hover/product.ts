interface Product {
    name: string,
    price: string,
    brand: string
}


export const productMap: Record<string, Product> = {
  "couch": {
    name: "Modern Sectional Sofa",
    price: "$1,299",
    brand: "West Elm"
  },
  "light": {
    name: "Arc Floor Lamp",
    price: "$249",
    brand: "CB2"
  },
  "potted plant": {
    name: "Fiddle Leaf Fig",
    price: "$89",
    brand: "The Sill"
  },
  "book": {
    name: "Coffee Table Book Set",
    price: "$45",
    brand: "Taschen"
  },
  "cup": {
    name: "Ceramic Mug",
    price: "$24",
    brand: "Heath Ceramics"
  }
}