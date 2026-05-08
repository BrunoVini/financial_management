<script lang="ts">
  import { settings } from '@/lib/appStore';
  import { t } from '@/i18n';

  const now = new Date();

  // Time-of-day greeting per locale. Falls back to a generic "Olá" /
  // "Hello" / etc. if hour isn't morning/afternoon/evening.
  const GREETINGS: Record<string, [string, string, string]> = {
    'pt-BR': ['Bom dia', 'Boa tarde', 'Boa noite'],
    en: ['Good morning', 'Good afternoon', 'Good evening'],
    fr: ['Bonjour', 'Bon après-midi', 'Bonsoir'],
    es: ['Buenos días', 'Buenas tardes', 'Buenas noches'],
  };

  function greeting(): string {
    const h = now.getHours();
    const map = GREETINGS[$settings.language] ?? GREETINGS.en;
    if (h < 12) return map[0];
    if (h < 18) return map[1];
    return map[2];
  }

  function formattedDate(): string {
    const lang = $settings.language === 'pt-BR' ? 'pt-BR' : $settings.language;
    return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long' }).format(now);
  }
</script>

<header class="topbar">
  <div class="brand">
    <span class="leaf" aria-hidden="true"></span>
    <span class="name">{$t('app.title')}</span>
  </div>
  <div class="greeting">{greeting()} · {formattedDate()}</div>
</header>

<style>
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-5);
    flex-wrap: wrap;
    gap: var(--space-3);
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }
  .leaf {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--accent-gradient);
    box-shadow: 0 4px 12px rgba(124, 148, 116, 0.28);
  }
  .name {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 1.2rem;
    letter-spacing: -0.01em;
    color: var(--text-primary);
  }
  .greeting {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 1rem;
    color: var(--text-secondary);
  }
</style>
