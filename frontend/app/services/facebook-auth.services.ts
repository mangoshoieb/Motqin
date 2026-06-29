export const signInWithFacebook = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.FB) {
        reject(new Error("Facebook SDK not loaded"));
        return;
      }
      console.log(window.FB);
      console.log("Calling FB.login...");
      window.FB.login(
        (response) => {
          console.log("FB Response:", response);
      
          if (
            response.authResponse &&
            response.authResponse.accessToken
          ) {
            console.log("facebook login success");
      
            resolve(response.authResponse.accessToken);
          } else {
            console.log("Login cancelled", response);
      
            reject(new Error("Facebook login cancelled"));
          }
        },
        {
          scope: "public_profile,email",
        }
      );
    });
  };