import { playWithFriendsEnabled } from "../play-with-friends/config";

/**
 * Structured Data Architecture for Projects & Experiences on About Me page.
 * Allows seamless addition of future projects/games without hardcoding separate markup.
 */
export const aboutProjectsData = [
  {
    id: "play-life",
    title: "Play Life",
    subtitle: "Your feelings. Your choices. Your story.",
    description: "An interactive experience about emotions, choices, motivation and everyday life.",
    route: "/play-life",
    ctaLabel: "Start Your Journey →",
    badgeText: "Interactive Experience",
    themeKey: "play-life",
    visualMotif: "horizon-path",
    bgImage: "/images/play-life-environment.png",
    enabled: true,
    order: 1,
  },
  {
    id: "play-with-friends",
    title: "Play With Friends",
    subtitle: "How well do your friends really know you?",
    description: "Create a room, invite your friends and discover what you really know about each other.",
    route: "/play-with-friends",
    ctaLabel: "Play Together →",
    badgeText: "Multiplayer Experience",
    themeKey: "play-with-friends",
    visualMotif: "social-connection",
    bgImage: "/images/play-with-friends-social.png",
    enabled: playWithFriendsEnabled,
    order: 2,
  },
];
