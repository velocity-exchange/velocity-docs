import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Logo } from "../components/Logo";

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <span className="inline-flex items-center gap-2">
        <Logo />
      </span>
    ),
    transparentMode: "top",
  },
  githubUrl: "https://github.com/velocity-exchange/velocity-docs",
  links: [
    { text: "Discord", url: "https://discord.com/invite/95kByNnDy5", external: true },
    { text: "App", url: "https://app.velocity.exchange", external: true },
  ],
};
