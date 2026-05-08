<script lang="ts">
  import { LayoutDashboard, Calendar, TrendingUp, Settings as Cog } from 'lucide-svelte';
  import { t } from '@/i18n';
  import { link, router } from 'svelte-spa-router';

  const items = [
    { href: '/', icon: LayoutDashboard, key: 'nav.overview' },
    { href: '/months', icon: Calendar, key: 'nav.months' },
    { href: '/investments', icon: TrendingUp, key: 'nav.investments' },
    { href: '/settings', icon: Cog, key: 'nav.settings' },
  ];

  function isActive(href: string, current: string): boolean {
    return current === href || (href !== '/' && current.startsWith(href));
  }
</script>

<nav>
  {#each items as item (item.href)}
    {@const Icon = item.icon}
    <a href={item.href} use:link class:active={isActive(item.href, router.location)}>
      <Icon size={20} />
      <span>{$t(item.key)}</span>
    </a>
  {/each}
</nav>

<style>
  nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    background: var(--bg-raised);
    border-top: 1px solid var(--border-subtle);
    padding: 6px var(--space-2);
    gap: 4px;
    justify-content: space-around;
    z-index: 10;
    box-shadow: 0 -4px 14px rgba(46, 42, 38, 0.06);
  }
  a {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 6px var(--space-2);
    border-radius: var(--radius-lg);
    color: var(--text-muted);
    text-decoration: none;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
    min-height: 44px;
    transition:
      color var(--motion-fast),
      background var(--motion-fast);
  }
  a.active {
    color: var(--accent-primary);
    background: var(--bg-glass);
  }
  @media (max-width: 768px) {
    nav {
      display: flex;
    }
  }
</style>
