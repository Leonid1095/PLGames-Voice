import { Match, Show, Switch } from "solid-js";
import { File as FileIcon, FileText, Headphones, Image, Video } from "lucide-solid";

import { File, MessageEmbed } from "stoat.js";
import { styled } from "styled-system/jsx";

import { IconButton, Text } from "@revolt/ui/components/design";
import { Column, Row } from "@revolt/ui/components/layout";
import { humanFileSize } from "@revolt/ui/components/utils";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

/**
 * Base container
 */
const Base = styled(Row, {
  base: {},
});

interface Props {
  /**
   * File information
   */
  file?: File;

  /**
   * Embed information
   */
  embed?: MessageEmbed;
}

/**
 * Information about a given attachment or embed
 */
export function FileInfo(props: Props) {
  return (
    <Base align>
      <Switch fallback={<FileIcon size={24} />}>
        <Match
          when={
            props.file?.metadata.type === "Image" ||
            props.embed?.type === "Image"
          }
        >
          <Image size={24} />
        </Match>
        <Match
          when={
            props.file?.metadata.type === "Video" ||
            props.embed?.type === "Video"
          }
        >
          <Video size={24} />
        </Match>
        <Match when={props.file?.metadata.type === "Audio"}>
          <Headphones size={24} />
        </Match>
        <Match when={props.file?.metadata.type === "Text"}>
          <FileText size={24} />
        </Match>
      </Switch>
      <Column grow>
        <span>{props.file?.filename}</span>
        <Show when={props.file?.size}>
          <Text class="label" size="small">
            {humanFileSize(props.file!.size!)}
          </Text>
        </Show>
      </Column>
      <Show when={props.file}>
        <a
          target="_blank"
          href={props.file?.originalUrl}
          download={props.file?.filename}
        >
          <IconButton>
            <Symbol>download</Symbol>
          </IconButton>
        </a>
      </Show>
    </Base>
  );
}
