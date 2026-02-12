import Head from "next/head";
import OrarioSyncApp from "../src/OrarioSyncApp";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>OrarioSync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <OrarioSyncApp />
      <footer>
        Copyright (c) 2018, Kevin Michael Frick. All rights reserved. This software is licensed under the{" "}
        <a href="https://raw.githubusercontent.com/kmfrick/orario-sync_react/master/LICENSE">
          BSD 3-Clause License
        </a>.
      </footer>
    </>
  );
}
