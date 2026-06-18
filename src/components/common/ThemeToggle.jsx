import { FaSun, FaMoon } from "react-icons/fa";
import { useThemeStore } from "@/store/theme/useThemeStore";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <label style={styles.wrapper}>
      <input
        type="checkbox"
        checked={isDark}
        onChange={toggleTheme}
        style={styles.input}
      />
      <span
        style={{
          ...styles.slider,
          backgroundColor: isDark ? "#222" : "#4d90fe",
        }}
      >
        {!isDark && <FaSun style={{ ...styles.icon, left: "6px" }} />}
        {isDark && <FaMoon style={{ ...styles.icon, right: "6px" }} />}
        <span
          style={{
            ...styles.circle,
            transform: isDark ? "translateX(2px)" : "translateX(26px)",
          }}
        />
      </span>
    </label>
  );
}

const styles = {
  wrapper: {
    position: "relative",
    width: "52px",
    height: "28px",
    display: "inline-block",
  },
  input: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  slider: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: "999px",
    cursor: "pointer",
    transition: "background-color 0.4s ease",
    overflow: "hidden",
  },
  circle: {
    position: "absolute",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    top: "2px",
    backgroundColor: "#fff",
    transition: "transform 0.4s ease",
    zIndex: 2,
  },
  icon: {
    position: "absolute",
    top: "7px",
    fontSize: "14px",
    color: "white",
    zIndex: 1,
    pointerEvents: "none",
  },
};
