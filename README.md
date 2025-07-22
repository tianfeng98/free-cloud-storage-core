# free-cloud-storage-core

[![NPM version](https://img.shields.io/npm/v/free-cloud-storage-core.svg?style=flat)](https://npmjs.com/package/free-cloud-storage-core)
[![NPM downloads](http://img.shields.io/npm/dm/free-cloud-storage-core.svg?style=flat)](https://npmjs.com/package/free-cloud-storage-core)

## Install

```bash
npm install free-cloud-storage-core
```

or

```bash
pnpm add free-cloud-storage-core
```

## Usage

```js
import { CloudStorage } from "free-cloud-storage-core";

const cloudStorage = new CloudStorage({
  fileBrowser: {
    server: "http://<filebrowser>",
    auth: "<jwt>", // or { username, password }
  },
});
```

### Get filebrowser file/folder resources

```js
const res = await cloudStorage.getResources("/test/file");
```

> If "/test/file" no exist, "/test/file.jsonlink" will be request.

### Get filebrowser file/folder blob

```js
const blob = await cloudStorage.getBlob("/test/file");
```

### Get remote file/folder resources

```js
const res = await cloudStorage.getResources("/test/file.jsonlink");
```

### Get remote folder file resources

```js
const res = await cloudStorage.getResources("/test/file.jsonlink/remote");
```

### Get remote file blob

```js
const res = await cloudStorage.getBlob("/test/file.jsonlink");
```

### Get remote folder file blob

```js
const res = await cloudStorage.getBlob("/test/file.jsonlink/remote.txt");
```

## Options

### CloudStorage

| Name                | Type                                | Description                             | Default     | Required |
| ------------------- | ----------------------------------- | --------------------------------------- | ----------- | -------- |
| fileBrowser         | `FileBrowserOptions \| FileBrowser` | Fileborwser config or object            | -           | ✅       |
| remoteFileExtension | `string`                            | The suffix used to identify remote file | `.jsonlink` | -        |

### Fileborwser

| Name        | Type                                               | Description                                                                          | Default | Required |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ | ------- | -------- |
| server      | `string`                                           | Fileborwser server address                                                           | -       | ✅       |
| auth        | `string \| { username: string; passwork: string }` | Fileborwser jwt or username/password                                                 | -       | ✅       |
| root        | `string`                                           | Fileborwser root directory                                                           | `/`     | -        |
| getCacheJwt | `() => string \| Promise<string>`                  | Get cache jwt token method. If not set or expired, program will login before use api | -       | -        |
| setCacheJwt | `(jwt: string) => void \| Promise<void>`           | Set cache jwt token method. If set, this method will provide the latest credential.  | -       | -        |

## LICENSE

Apache License 2.0
