import { useEffect } from "react";
import { useUser } from "@clerk/expo";
import { supabase } from "@/lib/supabase";
import { notificationService } from "@/services/notificationService";


export function useRealtimeNotifications() {
  const { user, isSignedIn } = useUser();
  const userId = user?.id;

  useEffect(() => {
    if (!isSignedIn || !userId) return;

    // 1. Register push token in background
    void notificationService.registerForPushNotificationsAsync(userId);

    // 2. Open Realtime channel for notifications
    const channel = supabase
      .channel(`realtime-alerts-${userId}`)
      // Activity join request listener
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_participants",
          filter: "status=eq.pending",
        },
        async (payload) => {
          const newParticipant = payload.new as {
            activity_id: string;
            user_id: string;
          };
          if (!newParticipant || newParticipant.user_id === userId) return;

          try {
            // Check if this activity belongs to current user
            const { data: activity } = await supabase
              .from("activities")
              .select("id, title, creator_id")
              .eq("id", newParticipant.activity_id)
              .maybeSingle();

            if (activity && activity.creator_id === userId) {
              const { data: requester } = await supabase
                .from("users")
                .select("display_name, username")
                .eq("id", newParticipant.user_id)
                .maybeSingle();

              const name =
                requester?.display_name || requester?.username || "Someone";

              await notificationService.presentLocalNotification(
                "New Join Request! 🎒",
                `${name} requested to join "${activity.title}". Tap to review.`,
                { type: "join_request", activityId: activity.id }
              );
            }
          } catch (e) {
            console.warn("Error handling join request notification:", e);
          }
        }
      )
      // Post comment listener
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "post_comments",
        },
        async (payload) => {
          const newComment = payload.new as {
            post_id: string;
            author_id: string;
            text: string;
          };
          if (!newComment || newComment.author_id === userId) return;

          try {
            // Check if current user is the author of this post
            const { data: post } = await supabase
              .from("posts")
              .select("id, author_id, text")
              .eq("id", newComment.post_id)
              .maybeSingle();

            if (post && post.author_id === userId) {
              const { data: commenter } = await supabase
                .from("users")
                .select("display_name, username")
                .eq("id", newComment.author_id)
                .maybeSingle();

              const name =
                commenter?.display_name || commenter?.username || "Someone";
              const snippet = newComment.text
                ? `"${newComment.text.slice(0, 45)}${newComment.text.length > 45 ? "..." : ""}"`
                : "your post";

              await notificationService.presentLocalNotification(
                "New Comment! 💬",
                `${name} commented: ${snippet}`,
                { type: "post_comment", postId: post.id }
              );
            }
          } catch (e) {
            console.warn("Error handling comment notification:", e);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isSignedIn, userId]);
}
