# myMadrassa - Educatief Beheersplatform

Een geavanceerd educatief beheersplatform speciaal ontworpen voor islamitische onderwijsinstellingen in Nederland, met focus op intuïtieve gebruikerservaring en culturele gevoeligheid.

## 🌟 Overzicht

myMadrassa is een volledig geïntegreerd schoolbeheersysteem dat alle aspecten van onderwijsadministratie beheert:

- **Studentenbeheer**: Registratie, dossiers, en voortgangsmonitoring
- **Voogeldbeheer**: Ouder/voogd informatie en communicatie
- **Aanwezigheidregistratie**: Real-time bijhouden van aanwezigheid
- **Betalingsbeheer**: Geïntegreerde Mollie betalingen voor schoolgelden
- **Berichten systeem**: Veilige communicatie tussen alle partijen
- **Dashboard**: Uitgebreide overzichten en statistieken
- **Multi-rol ondersteuning**: Admin, docent, ouder dashboards

## 🚀 Technische Stack

### Frontend
- **React** met TypeScript
- **Shadcn/ui** componenten bibliotheek
- **Tailwind CSS** voor responsive design
- **Wouter** voor routing
- **TanStack Query** voor data fetching
- **React Hook Form** met Zod validatie

### Backend
- **Express.js** met TypeScript
- **PostgreSQL** database via Neon
- **Drizzle ORM** voor database management
- **Mollie API** voor betalingsverwerking
- **Passport.js** voor authenticatie

### Development
- **Vite** als build tool
- **TypeScript** voor type safety
- **ESLint** voor code kwaliteit

## 🏗️ Projectstructuur

```
mymadrassa/
├── client/src/
│   ├── components/
│   │   ├── ui/              # Herbruikbare UI componenten
│   │   └── layout/          # Layout componenten
│   ├── pages/               # Pagina componenten
│   ├── lib/                 # Utilities en helpers
│   └── hooks/               # Custom React hooks
├── server/
│   ├── handlers/            # Route handlers
│   ├── middleware/          # Express middleware
│   ├── storage/             # Database storage layer
│   └── routes.ts            # API routes definitie
├── shared/
│   └── schema.ts            # Gedeelde database schema
└── docs/                    # Documentatie
```

## 🎨 Design Principes

### UI/UX Guidelines
- **Consistente componenten**: Herbruikbare UI componenten voor uniformiteit
- **Responsive design**: Optimaal voor desktop, tablet en mobiel
- **Toegankelijkheid**: WCAG compliant interface
- **Nederlandse lokalisatie**: Volledig Nederlandse interface

### Styling Conventies
- **Blauwe accent kleur**: `#1e40af` voor headers en primaire acties
- **Grijze achtergronden**: `#f1f5f9` voor detail screens
- **Compacte tabellen**: `text-xs` voor professionele uitstraling
- **Afgeronde hoeken**: Moderne vormgeving met `rounded-lg`

## 📊 Database Schema

### Kern Entiteiten

#### Students (Studenten)
```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR UNIQUE,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  date_of_birth DATE,
  address VARCHAR,
  status VARCHAR DEFAULT 'active'
);
```

#### Guardians (Voogden)
```sql
CREATE TABLE guardians (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  relationship VARCHAR,
  is_emergency_contact BOOLEAN DEFAULT false
);
```

#### Payments (Betalingen)
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),
  mollie_payment_id VARCHAR UNIQUE,
  amount DECIMAL(10,2),
  status VARCHAR,
  type VARCHAR,
  reference VARCHAR,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Uitgebreide Schema
Zie `shared/schema.ts` voor het complete Drizzle schema met alle relaties.

## 🔧 Installatie & Setup

### Vereisten
- Node.js 18+ 
- PostgreSQL database (Neon aanbevolen)
- Mollie account voor betalingen

### Stap 1: Repository Klonen
```bash
git clone https://github.com/jouworganisatie/mymadrassa.git
cd mymadrassa
```

### Stap 2: Dependencies Installeren
```bash
npm install
```

### Stap 3: Environment Variables
Maak een `.env` bestand aan:
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Mollie Payments
MOLLIE_API_KEY=test_your_mollie_key_here

# Session Secret
SESSION_SECRET=your-secret-key-here
```

### Stap 4: Database Setup
```bash
# Push schema naar database
npm run db:push

# Optioneel: seed data toevoegen
npm run db:seed
```

### Stap 5: Development Server
```bash
npm run dev
```

De applicatie is nu beschikbaar op `http://localhost:5000`

## 🔐 Authenticatie & Autorisatie

### Gebruikersrollen
- **Superadmin**: Volledige systeemtoegang
- **Admin**: Schoolspecifieke administratie
- **Teacher**: Docent functionaliteiten
- **Parent**: Ouder/voogd toegang

### Login Credentials (Development)
```
Superadmin: superadmin@example.com / admin123
Admin: admin@mymadrassa.be / admin123
```

## 💳 Betalingen Integratie

### Mollie Setup
1. Maak een Mollie account aan
2. Verkrijg je API key (test/live)
3. Configureer webhook URL in Mollie dashboard
4. Voeg API key toe aan environment variables

### Betalingsflow
```javascript
// 1. Payment aanmaken
const payment = await mollie.payments.create({
  amount: { value: '10.00', currency: 'EUR' },
  description: 'Schoolgeld',
  redirectUrl: 'https://yoursite.com/return',
  webhookUrl: 'https://yoursite.com/webhook'
});

// 2. Status updates via webhook
app.post('/webhook', async (req, res) => {
  const payment = await mollie.payments.get(req.body.id);
  // Update payment status in database
});
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px  
- **Desktop**: > 1024px

### Layout Patterns
```css
/* Mobile-first responsive grid */
.grid-responsive {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

/* Flexible form layouts */
.form-layout {
  @apply flex flex-col sm:flex-row sm:items-center gap-4;
}
```

## 🔧 Development Guidelines

### Component Architecture
```typescript
// Herbruikbare component structuur
interface ComponentProps {
  // Props definitie
}

export function Component({ ...props }: ComponentProps) {
  // Component logica
  return (
    // JSX
  );
}
```

### Data Fetching Pattern
```typescript
// TanStack Query pattern
export function useStudents() {
  return useQuery({
    queryKey: ['/api/students'],
    queryFn: () => fetch('/api/students').then(res => res.json())
  });
}
```

### Form Handling
```typescript
// React Hook Form met Zod validatie
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {}
});
```

## 🧪 Testing & Quality

### Code Quality
- TypeScript voor type safety
- ESLint voor consistente code style
- Prettier voor automatische formatting

### Database Migraties
```bash
# Schema wijzigingen pushen
npm run db:push

# Database status controleren
npm run db:studio
```

## 🚀 Deployment

### Replit Deployment
1. Push code naar GitHub repository
2. Connect Replit met GitHub
3. Configure environment variables
4. Deploy via Replit interface

### Environment Setup
```bash
# Production environment variables
DATABASE_URL=postgresql://prod-connection
MOLLIE_API_KEY=live_mollie_key
NODE_ENV=production
```

## 📚 API Documentatie

### Student Endpoints
```
GET /api/students - Alle studenten ophalen
POST /api/students - Nieuwe student aanmaken
GET /api/students/:id - Specifieke student
PUT /api/students/:id - Student bijwerken
DELETE /api/students/:id - Student verwijderen
```

### Payment Endpoints
```
GET /api/payments - Alle betalingen
POST /api/payments - Nieuwe betaling aanmaken
POST /api/payments/webhook - Mollie webhook
GET /api/payments/stats - Betalingsstatistieken
```

Zie `server/routes.ts` voor alle beschikbare endpoints.

## 🤝 Contributing

### Development Workflow
1. Fork het project
2. Maak feature branch: `git checkout -b feature/nieuwe-functie`
3. Commit wijzigingen: `git commit -m 'Voeg nieuwe functie toe'`
4. Push naar branch: `git push origin feature/nieuwe-functie`
5. Open een Pull Request

### Code Style
- Gebruik TypeScript voor alle nieuwe code
- Volg bestaande component patronen
- Schrijf duidelijke commit messages in het Nederlands
- Test je wijzigingen lokaal

## 📞 Support & Contact

Voor vragen, bug reports of feature requests:
- GitHub Issues voor technische problemen
- Email: support@mymadrassa.be
- Documentatie: `/docs` folder

## 📄 Licentie

Dit project is gelicenseerd onder de MIT License. Zie `LICENSE` bestand voor details.

---

**myMadrassa** - Modernizing Islamic Education Management 🎓