export const signInWithFacebook = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.FB) {
        reject(new Error("Facebook SDK not loaded"));
        return;
      }
  
      window.FB.login(
        (response) => {
          if (
            response.authResponse &&
            response.authResponse.accessToken
          ) {
            console.log("facebook login success")
            resolve(response.authResponse.accessToken);
          } else {
            reject(new Error("Facebook login cancelled"));
          }
        },
        {
          scope: "public_profile,email",
        }
      );
    });
  };