export const getBearerToken = (req: any) => {
  const bearerHeader = req.headers["authorization"] as string;

  // console.log({ bearerHeader });

  if (!bearerHeader) return null;

  const bearer = bearerHeader.split(" ");
  const bearerToken = bearer[1];

  return bearerToken;
};
