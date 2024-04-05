
# VoiceVox読み上げBot

たぶんカスコードです

## 注意

VoiceVoxアプリを起動した状態のPCが必要です。
詳細なことを言うと、`http://127.0.0.1:50021/` がVoiceVoxAPIになっている状態のPC環境が必要です。

## Buildするまえに

```
# /dist/secrets/index.example.ts
# example消してね
```
で必要なTokenを設定してください。

```
$ npx tsc
```

## Run

- Builded

```
$ node production/index.js
```

- not Builded

```
$ npx ts-node dist/index.ts
```

## Licence

under the MIT Licence

```
Copyright 2024 akikaki

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

