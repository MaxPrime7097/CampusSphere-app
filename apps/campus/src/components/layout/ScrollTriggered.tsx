import * as motion from "motion/react-client"
import type { Variants } from "motion/react"
import type { CSSProperties } from "react"

export type CardData = [string, number, number][]

interface ScrollTriggeredProps {
    cardData: CardData
}

interface CardProps {
    imageUrl: string
    hueA: number
    hueB: number
    i: number
}

const hue = (h: number) => `hsl(${h}, 95%, 48%)`

function Card({ imageUrl, hueA, hueB, i }: CardProps) {
    const background = `linear-gradient(135deg, ${hue(hueA)}, ${hue(hueB)})`

    return (
        <motion.div
            className={`card-container-${i}`}
            style={cardContainer}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ amount: 0.25, once: false }}
        >
            <div style={{ ...splash, background }} aria-hidden="true" />
            <motion.div style={card} variants={cardVariants} className="card">
                <img src={imageUrl} alt="" style={cardImage} loading="lazy" />
            </motion.div>
        </motion.div>
    )
}

export default function ScrollTriggered({ cardData }: ScrollTriggeredProps) {
    return (
        <div style={container}>
            {cardData.map(([imageUrl, hueA, hueB], i) => (
                <Card i={i} imageUrl={imageUrl} hueA={hueA} hueB={hueB} key={imageUrl} />
            ))}
        </div>
    )
}

const cardVariants: Variants = {
    offscreen: {
        y: 90,
        rotate: 0,
        opacity: 0.4,
    },
    onscreen: {
        y: 0,
        rotate: -3.5,
        opacity: 1,
        transition: {
            type: "spring",
            bounce: 0.28,
            duration: 0.85,
        },
    },
}

const container: CSSProperties = {
    margin: "0 auto",
    maxWidth: 360,
    width: "100%",
    position: "relative",
}

const cardContainer: CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    padding: "16px 8px",
    minHeight: 420,
}

const splash: CSSProperties = {
    position: "absolute",
    top: 24,
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 32,
    opacity: 0.22,
    filter: "blur(24px)",
    transform: "rotate(3deg)",
}

const card: CSSProperties = {
    position: "relative",
    zIndex: 1,
    width: "min(248px, 100%)",
    aspectRatio: "360 / 748",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    background: "#0d1117",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "0 24px 54px -14px rgba(0, 0, 0, 0.38)",
    transformOrigin: "center center",
    overflow: "hidden",
    padding: 0,
}

const cardImage: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "top center",
    display: "block",
    userSelect: "none",
}