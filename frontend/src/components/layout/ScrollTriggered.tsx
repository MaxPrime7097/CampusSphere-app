import * as motion from "motion/react-client"
import type { Variants } from "motion/react"
import type { CSSProperties } from "react" // Import CSSProperties for style typing

// --- 📦 Data Type ---

// Define the expected structure for a single card's data
type CardData = [
    string, // Image URL
    number, // Hue A for gradient (0-360)
    number  // Hue B for gradient (0-360)
][]

// --- ⚙️ Component Props ---

interface ScrollTriggeredProps {
    cardData: CardData // Component accepts the data as a prop
}

interface CardProps {
    imageUrl: string
    hueA: number
    hueB: number
    i: number
}

// --- 🎨 Utility Functions ---

const hue = (h: number) => `hsl(${h}, 100%, 50%)`

// --- 🖼️ Card Component ---

function Card({ imageUrl, hueA, hueB, i }: CardProps) {
    const background = `linear-gradient(306deg, ${hue(hueA)}, ${hue(hueB)})`

    return (
        <motion.div
            className={`card-container-${i}`}
            style={cardContainer}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ amount: 0.8 }}
        >
            <div style={{ ...splash, background }} />
            <motion.div style={card} variants={cardVariants} className="card">
                {/* Use the <img> tag for the image */}
                <img src={imageUrl} alt="Illustrated subject" style={cardImage} />
            </motion.div>
        </motion.div>
    )
}

// --- 🎯 Main Component ---

export default function ScrollTriggered({ cardData }: ScrollTriggeredProps) {
    return (
        <div style={container}>
            {/* Map over the passed cardData prop */}
            {cardData.map(([imageUrl, hueA, hueB], i) => (
                <Card i={i} imageUrl={imageUrl} hueA={hueA} hueB={hueB} key={imageUrl} />
            ))}
        </div>
    )
}

// --- 🚀 Animation Variants ---

const cardVariants: Variants = {
    offscreen: {
        y: 300,
    },
    onscreen: {
        y: 50,
        rotate: -10,
        transition: {
            type: "spring",
            bounce: 0.4,
            duration: 0.8,
        },
    },
}

// --- 🖼️ Styles ---

const container: CSSProperties = {
    margin: "0px auto",
    maxWidth: 500,
    paddingBottom: 100,
    width: "100%",
}

const cardContainer: CSSProperties = {
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    paddingTop: 20,
    marginBottom: -120,
}

const splash: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // This is the custom SVG clip-path for the background splash shape
    clipPath: `path("M 0 303.5 C 0 292.454 8.995 285.101 20 283.5 L 460 219.5 C 470.085 218.033 480 228.454 480 239.5 L 500 430 C 500 441.046 491.046 450 480 450 L 20 450 C 8.954 450 0 441.046 0 430 Z")`,
}

const card: CSSProperties = {
    width: 300,
    height: 430,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    background: "#f5f5f5",
    boxShadow:
        "0 0 1px hsl(0deg 0% 0% / 0.075), 0 0 2px hsl(0deg 0% 0% / 0.075), 0 0 4px hsl(0deg 0% 0% / 0.075), 0 0 8px hsl(0deg 0% 0% / 0.075), 0 0 16px hsl(0deg 0% 0% / 0.075)",
    transformOrigin: "10% 60%",
    overflow: "hidden", // Important for containing the image within the border radius
}

const cardImage: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover', // Choose 'cover' or 'contain' based on desired image behavior
    userSelect: 'none',
}