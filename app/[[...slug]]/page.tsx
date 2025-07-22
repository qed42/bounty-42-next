import { redirect } from "next/navigation";
import Image from "next/image";

import { getClient } from "@/utils/client";
import { gql } from "urql";
import { calculatePath } from "@/utils/calculate-path";
import AuthGuard from "@/components/AuthGuard";
import TeamModalForm from "@/components/03-organisms/team-modal-form";

interface PageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string>>;
}

async function getDrupalData({ params, searchParams }: PageProps) {
  const GET_DRUPAL_CONTENT_ERROR = "Error fetching data from Drupal";

  // const paramsValue = await params;
  const { slug } = await params;
  const pathFromParams = slug?.join("/");
  const searchParamsValue = await searchParams; // Await the searchParams promise
  const token = searchParamsValue.token;

  const drupalClient = await getClient({
    auth: {
      uri: process.env.DRUPAL_AUTH_URI!,
      clientId: process.env.DRUPAL_CLIENT_ID!,
      clientSecret: process.env.DRUPAL_CLIENT_SECRET!,
    },
    url: process.env.DRUPAL_GRAPHQL_URI!,
  });
  const { data, error } = await drupalClient.query(
    gql`
      query getNodeArticleByPath($path: String!) {
        route(path: $path) {
          ... on RouteInternal {
            entity {
              ... on NodeArticle {
                __typename
                title
                path
                metatag {
                  __typename
                  ... on MetaTagLink {
                    attributes {
                      rel
                      href
                    }
                  }
                  ... on MetaTagValue {
                    attributes {
                      name
                      content
                    }
                  }
                  ... on MetaTagProperty {
                    attributes {
                      property
                      content
                    }
                  }
                }
              }
              ... on NodePage {
                __typename
                title
                path
                body {
                  value
                }
                metatag {
                  __typename
                  ... on MetaTagLink {
                    attributes {
                      rel
                      href
                    }
                  }
                  ... on MetaTagValue {
                    attributes {
                      name
                      content
                    }
                  }
                  ... on MetaTagProperty {
                    attributes {
                      property
                      content
                    }
                  }
                }
              }
            }
          }
          ... on RouteRedirect {
            __typename
            url
            status
          }
        }
      }
    `,
    {
      path: calculatePath({
        path: pathFromParams,
        token: token,
      }),
    }
  );

  if (error) {
    throw new Response(GET_DRUPAL_CONTENT_ERROR, { status: 500 });
  }

  if (data.route.__typename === "RouteRedirect") {
    return redirect(data.route.url);
  }

  return { node: data.route.entity };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { node } = await getDrupalData({ params, searchParams });

  return (
    <AuthGuard>
      <div className="container mx-auto">
        <h1 className="text-6xl font-bold tracking-tighter leading-none mb-6 text-left">
          {node.title}
        </h1>
        <TeamModalForm />
        {node.image && (
          <Image
            src={node.image.url}
            alt={node.image.alt}
            width={node.image.width}
            height={node.image.height}
            className="mb-6 mx-auto max-w-lg"
          />
        )}
        <div
          className="max-w-sm lg:max-w-4xl mx-auto text-lg"
          dangerouslySetInnerHTML={{ __html: node.body.value }}
        />
      </div>
    </AuthGuard>
  );
}
