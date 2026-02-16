interface Product {
    name: string,
    price: string,
    brand: string,
    color: string,
    glowColor: string,
    rating: number,
    reviews: number,
    image: string
}


export const productMap: Record<string, Product> = {
  "couch": {
    name: "Modern Sectional Sofa",
    price: "$1,299",
    brand: "West Elm",
    color: "rgba(120, 113, 98, 0.85)",
    glowColor: "rgba(120, 113, 98, 0.4)",
    rating: 4.5,
    reviews: 128,
    image: "/semantic-image-hover/products/couch.jpg"
  },
  "light": {
    name: "Arc Floor Lamp",
    price: "$249",
    brand: "CB2",
    color: "rgba(30, 30, 30, 0.85)",
    glowColor: "rgba(50, 50, 50, 0.35)",
    rating: 4.8,
    reviews: 64,
    image: "/semantic-image-hover/products/lamp.jpg"
  },
  "potted plant": {
    name: "Fiddle Leaf Fig",
    price: "$89",
    brand: "The Sill",
    color: "rgba(76, 120, 60, 0.85)",
    glowColor: "rgba(76, 140, 60, 0.35)",
    rating: 4.2,
    reviews: 89,
    image: "/semantic-image-hover/products/plant.jpg"
  },
  "book": {
    name: "Coffee Table Book Set",
    price: "$45",
    brand: "Taschen",
    color: "rgba(139, 90, 60, 0.85)",
    glowColor: "rgba(139, 90, 60, 0.35)",
    rating: 4.7,
    reviews: 42,
    image: "/semantic-image-hover/products/book.jpg"
  },
  "cup": {
    name: "Ceramic Mug",
    price: "$24",
    brand: "Heath Ceramics",
    color: "rgba(45, 45, 45, 0.85)",
    glowColor: "rgba(80, 80, 80, 0.3)",
    rating: 4.9,
    reviews: 156,
    image: "/semantic-image-hover/products/mug.jpg"
  }
}