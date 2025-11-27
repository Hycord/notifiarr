import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const BLANK_CONFIG = `H4sIAAAAAAAAA32ST2sCMRDF736KIWeNydo/dK8thYJgoT219BDjuKbGJCRZoYjfvSTurusKnkJe3vzeDJPDCIDs0QdlDSmBcMooI+OkRrXDEMXOJb1gxf2E80nx8FkU5YyXs4Kyu6evk3WHUaxEFKSEwwgAgARbe4nP1qxV9S7iJjGmwrmpzFJz0N9gTUYMSl6UH1S0rto4IbcXLnrD0mbTi8QRwDE33hR2bVfaLoXu7gBkhWtR6zi3KQ1ltP4v8+hU2yo0kQDEWa3fTES/z/WcMTY+M5Z1ClkLHbBTPQYpzNxWYWE+ovCxdlce2c7ZSyb58dgMK5zqt4tGLDWuSAnR19jrzkdSwowx3mkbG2JeefGYlk75eZgT5VVpXLjQsC5SpVZoYnr6/mnXhz79o76E+yuTMtuTcF7BAHUFGmL6kOM/ZZ/c08ACAAA=`;