export const signInWithFacebook = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject("SDK not loaded");
      return;
    }

    console.log("Calling FB.login...");

    window.FB.login(
      (response) => {
        console.log("FB Response:", response);

        if (response.status === "connected") {
          console.log("Access Token:", response.authResponse?.accessToken);

          resolve(response.authResponse!.accessToken);
        } else {
          console.log("Login cancelled");

          reject(response);
        }
      },
      {
        scope: "public_profile,email",
      }
    );
  });
};
