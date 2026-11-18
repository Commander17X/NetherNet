import { ServerListView } from "@/components/ServerListView";
import { Screen } from "@/components/Screen";

export default function FavoritesScreen() {
  return (
    <Screen>
      <ServerListView favoritesOnly />
    </Screen>
  );
}
