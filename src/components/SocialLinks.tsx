type SocialIconProps = {
  className?: string;
};

const socialLinks = [
  {
    href: 'https://github.com/ciaassured/EveningStar',
    label: 'CIA GitHub',
    shorthand: 'github/EveningStar',
    Icon: GitHubIcon
  },
  {
    href: 'https://www.youtube.com/@ciaassured',
    label: 'CIA YouTube',
    shorthand: 'youtube/@ciaassured',
    Icon: YouTubeIcon
  }
] as const;

function GitHubIcon({ className }: SocialIconProps) {
  return (
    <svg aria-hidden="true" className={className} focusable="false" viewBox="0 0 24 24">
      <path
        d="M12 2C6.48 2 2 6.58 2 12.22c0 4.52 2.87 8.35 6.84 9.7.5.09.68-.22.68-.49v-1.88c-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.55-1.13-4.55-5.03 0-1.11.39-2.02 1.03-2.73-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.04A9.31 9.31 0 0 1 12 6.97c.85 0 1.71.12 2.51.34 1.91-1.32 2.75-1.04 2.75-1.04.55 1.4.2 2.44.1 2.7.64.71 1.03 1.62 1.03 2.73 0 3.91-2.34 4.77-4.57 5.02.36.32.68.94.68 1.9v2.81c0 .27.18.59.69.49A10.17 10.17 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function YouTubeIcon({ className }: SocialIconProps) {
  return (
    <svg aria-hidden="true" className={className} focusable="false" viewBox="0 0 24 24">
      <path
        d="M21.58 7.2a2.72 2.72 0 0 0-1.91-1.93C17.98 4.82 12 4.82 12 4.82s-5.98 0-7.67.45A2.72 2.72 0 0 0 2.42 7.2C2 8.91 2 12.48 2 12.48s0 3.57.42 5.28a2.72 2.72 0 0 0 1.91 1.93c1.69.45 7.67.45 7.67.45s5.98 0 7.67-.45a2.72 2.72 0 0 0 1.91-1.93c.42-1.71.42-5.28.42-5.28s0-3.57-.42-5.28ZM10.02 15.72v-6.48l5.22 3.24-5.22 3.24Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SocialLinks() {
  return (
    <nav aria-label="CIA social links" className="social-links">
      {socialLinks.map(({ href, label, shorthand, Icon }) => (
        <a aria-label={label} className="social-links__button" href={href} key={label} rel="noreferrer" target="_blank">
          <span className="social-links__assistive">{label}</span>
          <span className="social-links__icon" aria-hidden="true">
            <Icon className="social-links__svg" />
          </span>
          <span className="social-links__label" aria-hidden="true">
            {shorthand}
          </span>
        </a>
      ))}
    </nav>
  );
}
