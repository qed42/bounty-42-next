import { CardItem } from "@/components/02-molecules/card-item"

interface Card {
  id: string
  title: string
  description: string
  teamCount: number
  image: string
}

interface CardsSectionProps {
  title: string
  description: string
  cards: Card[]
}

export function CardsSection({ title, description, cards }: CardsSectionProps) {
  return (
    <section className="py-12 px-4 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight mb-4">{title}</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{description}</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <CardItem
            key={card.id}
            id={card.id}
            title={card.title}
            description={card.description}
            teamCount={card.teamCount}
            image={card.image}
          />
        ))}
      </div>
    </section>
  )
}
