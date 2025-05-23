import { useState, useEffect } from "react";
import axios from "axios";

function useUserData(session) {
  const [userData, setUserData] = useState({
    name: "Guest",
    resultsCount: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    let isSubscribed = true;

    async function manageUser() {
      if (!session?.user?.email) {
        setUserData({ name: "Guest", resultsCount: 0 });
        setError(null);
        return;
      }

      try {
        setError(null);
        const response = await axios.get(
          `/api/users/info?email=${encodeURIComponent(session.user.email)}`
        );

        if (!isSubscribed) return;

        if (response.data?.user) {
          setUserData({
            name: response.data.user.name,
            resultsCount: response.data.user.resultsCount || 0,
          });
          setError(null);
        }
      } catch (error) {
        if (!isSubscribed) return;

        console.error("Error fetching user info:", error);

        if (error.response?.status === 404) {
          try {
            setError(null);
            const registerResponse = await axios.post("/api/users/register", {
              email: session.user.email,
              name: session.user.name,
              avatar: session.user.image,
            });

            if (!isSubscribed) return;

            if (registerResponse.data?.user) {
              setUserData({
                name: registerResponse.data.user.name,
                resultsCount: 0,
              });
              setError(null);
            }
          } catch (registerError) {
            console.error("Error registering user:", registerError);
            if (!isSubscribed) return;
            setError("Failed to register user.");
          }
        } else {
          setError("Failed to fetch user data.");
        }
      }
    }

    manageUser();

    // Listen for refresh-history event to refetch user data
    function handleRefresh() {
      manageUser();
    }
    window.addEventListener("refresh-history", handleRefresh);
    return () => {
      isSubscribed = false;
      window.removeEventListener("refresh-history", handleRefresh);
    };
  }, [session?.user?.email, session?.user?.name, session?.user?.image]);

  return { userData, error };
}

export { useUserData };
