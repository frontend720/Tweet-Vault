rsync -av --exclude node_modules /Users/jahanthony/jahs-projects/Vault/server/ /Volumes/Home/jah-cloud/server/

mkdir /Volumes/Home/jah-cloud
rsync -av --exclude node_modules /Users/jahanthony/jahs-projects/Vault/server/ /Volumes/Home/jah-cloud/server/


cd /Users/jahanthony/jah-cloud/server
npm install
cp .env.example .env

pm2 start index.js --name vault
pm2 save

Errors:

jahanthony@Jahs-MacBook-Pro Home % rsync -av --exclude node_modules /Users/jahanthony/jahs-projects/Vault/server/ /Volumes/Home/jah-cloud/server/

building file list ... rsync: link_stat "/Users/jahanthony/jahs-projects/Vault/server/." failed: No such file or directory (2)
done
rsync: mkdir "/Volumes/Home/jah-cloud/server" failed: No such file or directory (2)
rsync error: error in file IO (code 11) at /AppleInternal/Library/BuildRoots/bc10cbcd-3cda-11ee-b8ac-16228a05f5d2/Library/Caches/com.apple.xbs/Sources/rsync/rsync/main.c(545) [receiver=2.6.9]
rsync: connection unexpectedly closed (8 bytes received so far) [sender]
rsync error: error in rsync protocol data stream (code 12) at /AppleInternal/Library/BuildRoots/bc10cbcd-3cda-11ee-b8ac-16228a05f5d2/Library/Caches/com.apple.xbs/Sources/rsync/rsync/io.c(453) [sender=2.6.9]
jahanthony@Jahs-MacBook-Pro Home % 



pm2 restart vault

/jahs-projects/Vault/server/ /Volumes/Home/jah-cloud/server/

building file list ... rsync: link_stat "/Users/jahanthony/jahs-projects/Vault/server/." failed: No such file or directory (2)
done
rsync: mkdir "/Volumes/Home/jah-cloud/server" failed: No such file or directory (2)
rsync error: error in file IO (code 11) at /AppleInternal/Library/BuildRoots/bc10cbcd-3cda-11ee-b8ac-16228a05f5d2/Library/Caches/com.apple.xbs/Sources/rsync/rsync/main.c(545) [receiver=2.6.9]
rsync: connection unexpectedly closed (8 bytes received so far) [sender]
rsync error: error in rsync protocol data stream (code 12) at /AppleInternal/Library/BuildRoots/bc10cbcd-3cda-11ee-b8ac-16228a05f5d2/Library/Caches/com.apple.xbs/Sources/rsync/rsync/io.c(453) [sender=2.6.9]
jahanthony@Jahs-MacBook-Pro Home % /Volumes/Home/jah-cloud/
zsh: no such file or directory: /Volumes/Home/jah-cloud/
jahanthony@Jahs-MacBook-Pro Home % mkdir /Volumes/Home/jah-cloud
rsync -av --exclude node_modules /Users/jahanthony/jahs-projects/Vault/server/ /Volumes/Home/jah-cloud/server/
building file list ... rsync: link_stat "/Users/jahanthony/jahs-projects/Vault/server/." failed: No such file or directory (2)
done
created directory /Volumes/Home/jah-cloud/server

sent 29 bytes  received 20 bytes  98.00 bytes/sec
total size is 0  speedup is 0.00
rsync error: some files could not be transferred (code 23) at /AppleInternal/Library/BuildRoots/bc10cbcd-3cda-11ee-b8ac-16228a05f5d2/Library/Caches/com.apple.xbs/Sources/rsync/rsync/main.c(996) [sender=2.6.9]
jahanthony@Jahs-MacBook-Pro Home % cd /Users/jahanthony/jah-cloud/server
npm install
cp .env.example .env
cd: no such file or directory: /Users/jahanthony/jah-cloud/server
npm error code ENOENT
npm error syscall open
npm error path /Volumes/Home/package.json
npm error errno -2
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/Volumes/Home/package.json'
npm error enoent This is related to npm not being able to find a file.
npm error enoent
npm error A complete log of this run can be found in: /Users/jahanthony/.npm/_logs/2026-05-18T16_16_30_100Z-debug-0.log
cp: .env.example: No such file or directory
jahanthony@Jahs-MacBook-Pro Home % 

npm warn deprecated prebuild-install@7.1.3: No longer maintained. Please contact the author of the relevant native addon; alternatives are available.
jahanthony@Jahs-MacBook-Pro server % npm install
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated are-we-there-yet@2.0.0: This package is no longer supported.
npm warn deprecated npmlog@5.0.1: This package is no longer supported.
npm warn deprecated gauge@3.0.2: This package is no longer supported.
npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
npm warn deprecated tar@6.2.1: Old versions of tar are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
npm error code 1
npm error path /Volumes/Home/jah-cloud/server/node_modules/better-sqlite3
npm error command failed
npm error command sh -c prebuild-install || node-gyp rebuild --release
npm error TOUCH 4292fa9a667d77b27488aa109b010a85bce8e4e7a1c7aa0370cea902395c3866.intermediate
npm error   ACTION deps_sqlite3_gyp_locate_sqlite3_target_copy_builtin_sqlite3 4292fa9a667d77b27488aa109b010a85bce8e4e7a1c7aa0370cea902395c3866.intermediate
npm error   TOUCH Release/obj.target/deps/locate_sqlite3.stamp
npm error   CC(target) Release/obj.target/sqlite3/gen/sqlite3/sqlite3.o
npm error   LIBTOOL-STATIC Release/sqlite3.a
npm error   CXX(target) Release/obj.target/better_sqlite3/src/better_sqlite3.o
npm error rm 4292fa9a667d77b27488aa109b010a85bce8e4e7a1c7aa0370cea902395c3866.intermediate
npm error (node:77563) [DEP0176] DeprecationWarning: fs.R_OK is deprecated, use fs.constants.R_OK instead
npm error (Use `node --trace-deprecation ...` to show where the warning was created)
npm error prebuild-install warn install No prebuilt binaries found (target=24.15.0 runtime=node arch=x64 libc= platform=darwin)
npm error gyp info it worked if it ends with ok
npm error gyp info using node-gyp@12.2.0
npm error gyp info using node@24.15.0 | darwin | x64
npm error gyp info find Python using Python version 3.14.5 found at "/usr/local/opt/python@3.14/bin/python3.14"
npm error gyp info spawn /usr/local/opt/python@3.14/bin/python3.14
npm error gyp info spawn args [
npm error gyp info spawn args '/Users/jahanthony/.nvm/versions/node/v24.15.0/lib/node_modules/npm/node_modules/node-gyp/gyp/gyp_main.py',
npm error gyp info spawn args 'binding.gyp',
npm error gyp info spawn args '-f',
npm error gyp info spawn args 'make',
npm error gyp info spawn args '-I',
npm error gyp info spawn args '/Volumes/Home/jah-cloud/server/node_modules/better-sqlite3/build/config.gypi',
npm error gyp info spawn args '-I',
npm error gyp info spawn args '/Users/jahanthony/.nvm/versions/node/v24.15.0/lib/node_modules/npm/node_modules/node-gyp/addon.gypi',
npm error gyp info spawn args '-I',
npm error gyp info spawn args '/Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/common.gypi',
npm error gyp info spawn args '-Dlibrary=shared_library',
npm error gyp info spawn args '-Dvisibility=default',
npm error gyp info spawn args '-Dnode_root_dir=/Users/jahanthony/Library/Caches/node-gyp/24.15.0',
npm error gyp info spawn args '-Dnode_gyp_dir=/Users/jahanthony/.nvm/versions/node/v24.15.0/lib/node_modules/npm/node_modules/node-gyp',
npm error gyp info spawn args '-Dnode_lib_file=/Users/jahanthony/Library/Caches/node-gyp/24.15.0/<(target_arch)/node.lib',
npm error gyp info spawn args '-Dmodule_root_dir=/Volumes/Home/jah-cloud/server/node_modules/better-sqlite3',
npm error gyp info spawn args '-Dnode_engine=v8',
npm error gyp info spawn args '--depth=.',
npm error gyp info spawn args '--no-parallel',
npm error gyp info spawn args '--generator-output',
npm error gyp info spawn args 'build',
npm error gyp info spawn args '-Goutput_dir=.'
npm error gyp info spawn args ]
npm error gyp info spawn make
npm error gyp info spawn args [ 'BUILDTYPE=Release', '-C', 'build' ]
npm error In file included from ../src/better_sqlite3.cpp:4:
npm error In file included from ./src/better_sqlite3.lzz:11:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/node.h:74:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8.h:23:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/cppgc/common.h:8:
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8config.h:13:2: error: "C++20 or later required."
npm error #error "C++20 or later required."
npm error  ^
npm error In file included from ../src/better_sqlite3.cpp:4:
npm error In file included from ./src/better_sqlite3.lzz:11:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/node.h:74:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8.h:24:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-array-buffer.h:12:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-local-handle.h:13:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-handle-base.h:8:
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-internal.h:1256:37: error: a non-type template parameter cannot have type 'v8::internal::ExternalPointerTagRange' (aka 'TagRange<v8::internal::ExternalPointerTag>') before C++20
npm error   template <ExternalPointerTagRange tag_range>
npm error                                     ^
npm error In file included from ../src/better_sqlite3.cpp:4:
npm error In file included from ./src/better_sqlite3.lzz:11:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/node.h:74:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8.h:24:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-array-buffer.h:12:
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-local-handle.h:280:5: error: unknown type name 'requires'
npm error     requires std::is_base_of_v<T, S>
npm error     ^
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-local-handle.h:280:19: error: member 'is_base_of_v' declared as a template
npm error     requires std::is_base_of_v<T, S>
npm error                   ^
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-local-handle.h:280:37: error: expected ';' at end of declaration list
npm error     requires std::is_base_of_v<T, S>
npm error                                     ^
npm error                                     ;
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-local-handle.h:645:5: error: unknown type name 'requires'
npm error     requires std::is_base_of_v<T, S>
npm error     ^
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-local-handle.h:645:19: error: member 'is_base_of_v' declared as a template
npm error     requires std::is_base_of_v<T, S>
npm error                   ^
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-local-handle.h:645:37: error: expected ';' at end of declaration list
npm error     requires std::is_base_of_v<T, S>
npm error                                     ^
npm error                                     ;
npm error In file included from ../src/better_sqlite3.cpp:4:
npm error In file included from ./src/better_sqlite3.lzz:11:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/node.h:74:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8.h:24:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-array-buffer.h:13:
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-memory-span.h:45:28: error: no member named 'ranges' in namespace 'std'
npm error inline constexpr bool std::ranges::enable_view<v8::MemorySpan<T>> = true;
npm error                       ~~~~~^
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-memory-span.h:47:28: error: no member named 'ranges' in namespace 'std'
npm error inline constexpr bool std::ranges::enable_borrowed_range<v8::MemorySpan<T>> =
npm error                       ~~~~~^
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-memory-span.h:168:35: error: no type named 'contiguous_iterator_tag' in namespace 'std'; did you mean 'output_iterator_tag'?
npm error     using iterator_concept = std::contiguous_iterator_tag;
npm error                              ~~~~~^~~~~~~~~~~~~~~~~~~~~~~
npm error                                   output_iterator_tag
npm error /Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/include/c++/v1/__iterator/iterator_traits.h:53:29: note: 'output_iterator_tag' declared here
npm error struct _LIBCPP_TEMPLATE_VIS output_iterator_tag {};
npm error                             ^
npm error In file included from ../src/better_sqlite3.cpp:4:
npm error In file included from ./src/better_sqlite3.lzz:11:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/node.h:74:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8.h:24:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-array-buffer.h:14:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-object.h:10:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-maybe.h:11:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/cppgc/internal/conditional-stack-allocated.h:10:
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/cppgc/macros.h:51:1: error: unknown type name 'concept'
npm error concept IsStackAllocatedType =
npm error ^
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/cppgc/macros.h:52:5: error: use of undeclared identifier 'requires'
npm error     requires { typename T::IsStackAllocatedTypeMarker; };
npm error     ^
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/cppgc/macros.h:52:13: error: expected ';' at end of declaration
npm error     requires { typename T::IsStackAllocatedTypeMarker; };
npm error             ^
npm error             ;
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/cppgc/macros.h:52:14: error: expected unqualified-id
npm error     requires { typename T::IsStackAllocatedTypeMarker; };
npm error              ^
npm error In file included from ../src/better_sqlite3.cpp:4:
npm error In file included from ./src/better_sqlite3.lzz:11:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/node.h:74:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8.h:24:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-array-buffer.h:14:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-object.h:10:
npm error In file included from /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/v8-maybe.h:11:
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/cppgc/internal/conditional-stack-allocated.h:22:1: error: unknown type name 'concept'
npm error concept RequiresStackAllocated =
npm error ^
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/cppgc/internal/conditional-stack-allocated.h:28:3: error: C++ requires a type specifier for all declarations
npm error   requires(RequiresStackAllocated<T>)
npm error   ^
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/cppgc/internal/conditional-stack-allocated.h:28:38: error: expected ';' at end of declaration
npm error   requires(RequiresStackAllocated<T>)
npm error                                      ^
npm error                                      ;
npm error /Users/jahanthony/Library/Caches/node-gyp/24.15.0/include/node/cppgc/internal/conditional-stack-allocated.h:29:37: error: use of undeclared identifier 'T'
npm error class ConditionalStackAllocatedBase<T> {
npm error                                     ^
npm error fatal error: too many errors emitted, stopping now [-ferror-limit=]
npm error 20 errors generated.
npm error make: *** [Release/obj.target/better_sqlite3/src/better_sqlite3.o] Error 1
npm error gyp ERR! build error 
npm error gyp ERR! stack Error: `make` failed with exit code: 2
npm error gyp ERR! stack at ChildProcess.<anonymous> (/Users/jahanthony/.nvm/versions/node/v24.15.0/lib/node_modules/npm/node_modules/node-gyp/lib/build.js:219:23)
npm error gyp ERR! System Darwin 21.6.0
npm error gyp ERR! command "/Users/jahanthony/.nvm/versions/node/v24.15.0/bin/node" "/Users/jahanthony/.nvm/versions/node/v24.15.0/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js" "rebuild" "--release"
npm error gyp ERR! cwd /Volumes/Home/jah-cloud/server/node_modules/better-sqlite3
npm error gyp ERR! node -v v24.15.0
npm error gyp ERR! node-gyp -v v12.2.0
npm error gyp ERR! $npm_package_name better-sqlite3
npm error gyp ERR! $npm_package_version 9.6.0
npm error gyp ERR! not ok
npm error A complete log of this run can be found in: /Users/jahanthony/.npm/_logs/2026-05-18T17_20_38_691Z-debug-0.log
jahanthony@Jahs-MacBook-Pro server 

rsync -av /Users/jahanthony/jahs-projects/Vault/server/package.json /Volumes/Home/jah-cloud/server/

server/package.json /Volumes/Home/jah-cloud/server/

building file list ... rsync: link_stat "/Users/jahanthony/jahs-projects/Vault/server/package.json" failed: No such file or directory (2)
done

sent 29 bytes  received 20 bytes  98.00 bytes/sec
total size is 0  speedup is 0.00
rsync error: some files could not be transferred (code 23) at /AppleInternal/Library/BuildRoots/bc10cbcd-3cda-11ee-b8ac-16228a05f5d2/Library/Caches/com.apple.xbs/Sources/rsync/rsync/main.c(996) [sender=2.6.9]
jahanthony@Jahs-MacBook-Pro server %

rsync -av /Users/jahanthony/jahs-projects/Vault/server/package.json /Volumes/Home/jah-cloud/server/

jahanthony@Jahs-MacBook-Pro server % rsync -av /Users/jahanthony/jahs-projects/Vault/server/package.json /Volumes/Home/jah-cloud/server/
building file list ... rsync: link_stat "/Users/jahanthony/jahs-projects/Vault/server/package.json" failed: No such file or directory (2)
done

sent 29 bytes  received 20 bytes  98.00 bytes/sec
total size is 0  speedup is 0.00
rsync error: some files could not be transferred (code 23) at /AppleInternal/Library/BuildRoots/bc10cbcd-3cda-11ee-b8ac-16228a05f5d2/Library/Caches/com.apple.xbs/Sources/rsync/rsync/main.c(996) [sender=2.6.9]
jahanthony@Jahs-MacBook-Pro server % 



pm2 start index.js --name jah-cloud-auth
pm2 save          # persist across reboots
pm2 startup       # generate startup script (follow the printed command)


cat > /Users/jahanthony/jah-cloud/server/index.js << 'EOF'
require('dotenv').config()
const fs = require('fs')
const http = require('http')
const https = require('https')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')

const authRoutes = require('./routes/auth')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 4501

app.set('trust proxy', 1)

const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean)

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

app.use(helmet())
app.options('*', cors(corsOptions))
app.use(cors(corsOptions))
app.use(express.json({ limit: '16kb' }))
app.use(cookieParser())

app.use('/auth', authRoutes)
app.use(errorHandler)

const certPath = process.env.TLS_CERT
const keyPath  = process.env.TLS_KEY

if (certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  https.createServer(
    { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) },
    app
  ).listen(PORT, () => console.log(`[auth] HTTPS :${PORT}`))
} else {
  console.warn('[auth] TLS certs not found — running plain HTTP')
  http.createServer(app).listen(PORT, () => console.log(`[auth] HTTP :${PORT}`))
}
EOF
pm2 restart jah-cloud-auth



head -25 /Users/jahanthony/jah-cloud/server/index.js

jahanthony@Jahs-MacBook-Pro server % head -25 /Users/jahanthony/jah-cloud/server/index.js
head: /Users/jahanthony/jah-cloud/server/index.js: No such file or directory
jahanthony@Jahs-MacBook-Pro server

pm2 logs jah-cloud-auth --lines 30 --nostream

jahanthony@Jahs-MacBook-Pro server % head -25 /Users/jahanthony/jah-cloud/server/index.js
head: /Users/jahanthony/jah-cloud/server/index.js: No such file or directory
jahanthony@Jahs-MacBook-Pro server % pm2 logs jah-cloud-auth --lines 30 --nostream
[TAILING] Tailing last 30 lines for [jah-cloud-auth] process (change the value with --lines option)
/Users/jahanthony/.pm2/logs/jah-cloud-auth-error.log last 30 lines:
3|jah-clou | [auth] TLS certs not found — running plain HTTP
3|jah-clou | [auth] TLS certs not found — running plain HTTP
3|jah-clou | [auth] TLS certs not found — running plain HTTP
3|jah-clou | [auth] TLS certs not found — running plain HTTP
3|jah-clou | [auth] TLS certs not found — running plain HTTP

/Users/jahanthony/.pm2/logs/jah-cloud-auth-out.log last 30 lines:
3|jah-clou | [auth] HTTP :4501
3|jah-clou | [auth] HTTP :4501
3|jah-clou | [auth] HTTP :4501
3|jah-clou | [auth] HTTP :4501
3|jah-clou | [auth] HTTP :4501

jahanthony@Jahs-MacBook-Pro server

pm2 show jah-cloud-auth | grep path


jahanthony@Jahs-MacBook-Pro server % pm2 show jah-cloud-auth | grep path
│ script path       │ /Volumes/Home/jah-cloud/server/index.js              │
│ error log path    │ /Users/jahanthony/.pm2/logs/jah-cloud-auth-error.log │
│ out log path      │ /Users/jahanthony/.pm2/logs/jah-cloud-auth-out.log   │
│ pid path          │ /Users/jahanthony/.pm2/pids/jah-cloud-auth-3.pid     │
jahanthony@Jahs-MacBook-Pro server %

cat > /Volumes/Home/jah-cloud/server/index.js << 'EOF'
require('dotenv').config()
const fs = require('fs')
const http = require('http')
const https = require('https')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')

const authRoutes = require('./routes/auth')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 4501

app.set('trust proxy', 1)

const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean)

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

app.use(helmet())
app.options('*', cors(corsOptions))
app.use(cors(corsOptions))
app.use(express.json({ limit: '16kb' }))
app.use(cookieParser())

app.use('/auth', authRoutes)
app.use(errorHandler)

const certPath = process.env.TLS_CERT
const keyPath  = process.env.TLS_KEY

if (certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  https.createServer(
    { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) },
    app
  ).listen(PORT, () => console.log(`[auth] HTTPS :${PORT}`))
} else {
  console.warn('[auth] TLS certs not found — running plain HTTP')
  http.createServer(app).listen(PORT, () => console.log(`[auth] HTTP :${PORT}`))
}
EOF
pm2 restart jah-cloud-auth

pm2 restart jah-cloud-auth
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [jah-cloud-auth](ids: [ 3 ])
[PM2] [jah-cloud-auth](3) ✓
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 3  │ jah-cloud-auth     │ fork     │ 5    │ online    │ 0%       │ 812.0kb  │
│ 0  │ tweet-vault        │ fork     │ 42   │ online    │ 0%       │ 137.7mb  │
│ 2  │ vault-viewer       │ fork     │ 1    │ online    │ 0%       │ 74.9mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
jahanthony@Jahs-MacBook-Pro server % 

pm2 logs jah-cloud-auth --lines 20 --nostream

jahanthony@Jahs-MacBook-Pro server % pm2 logs jah-cloud-auth --lines 20 --nostream
[TAILING] Tailing last 20 lines for [jah-cloud-auth] process (change the value with --lines option)
/Users/jahanthony/.pm2/logs/jah-cloud-auth-error.log last 20 lines:
3|jah-clou | [auth] TLS certs not found — running plain HTTP
3|jah-clou | [auth] TLS certs not found — running plain HTTP
3|jah-clou | [auth] TLS certs not found — running plain HTTP
3|jah-clou | [auth] TLS certs not found — running plain HTTP
3|jah-clou | [auth] TLS certs not found — running plain HTTP
3|jah-clou | [auth] TLS certs not found — running plain HTTP

/Users/jahanthony/.pm2/logs/jah-cloud-auth-out.log last 20 lines:
3|jah-clou | [auth] HTTP :4501
3|jah-clou | [auth] HTTP :4501
3|jah-clou | [auth] HTTP :4501
3|jah-clou | [auth] HTTP :4501
3|jah-clou | [auth] HTTP :4501
3|jah-clou | [auth] HTTP :4501

jahanthony@Jahs-MacBook-Pro server % 


curl -v -X OPTIONS http://localhost:4501/auth/signup \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"

jahanthony@Jahs-MacBook-Pro server % curl -v -X OPTIONS http://localhost:4501/auth/signup \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
* Host localhost:4501 was resolved.
* IPv6: ::1
* IPv4: 127.0.0.1
*   Trying [::1]:4501...
* Connected to localhost (::1) port 4501
> OPTIONS /auth/signup HTTP/1.1
> Host: localhost:4501
> User-Agent: curl/8.7.1
> Accept: */*
> Origin: http://localhost:3000
> Access-Control-Request-Method: POST
> Access-Control-Request-Headers: Content-Type
> 
* Request completely sent off
< HTTP/1.1 204 No Content
< Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
< Cross-Origin-Opener-Policy: same-origin
< Cross-Origin-Resource-Policy: same-origin
< Origin-Agent-Cluster: ?1
< Referrer-Policy: no-referrer
< Strict-Transport-Security: max-age=15552000; includeSubDomains
< X-Content-Type-Options: nosniff
< X-DNS-Prefetch-Control: off
< X-Download-Options: noopen
< X-Frame-Options: SAMEORIGIN
< X-Permitted-Cross-Domain-Policies: none
< X-XSS-Protection: 0
< Access-Control-Allow-Origin: http://localhost:3000
< Vary: Origin
< Access-Control-Allow-Credentials: true
< Access-Control-Allow-Methods: GET,POST,OPTIONS
< Access-Control-Allow-Headers: Content-Type,Authorization
< Content-Length: 0
< Date: Mon, 18 May 2026 19:02:53 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
< 
* Connection #0 to host localhost left intact
jahanthony@Jahs-MacBook-Pro server % 

pm2 logs jah-cloud-auth --lines 30 --nostream

jahanthony@Jahs-MacBook-Pro server % pm2 logs jah-cloud-auth --lines 30 --nostream
[TAILING] Tailing last 30 lines for [jah-cloud-auth] process (change the value with --lines option)
/Users/jahanthony/.pm2/logs/jah-cloud-auth-out.log last 30 lines:
3|jah-clou | [auth] HTTP :4501
3|jah-clou | [auth] HTTP :4501
3|jah-clou | [auth] HTTP :4501
3|jah-clou | [auth] HTTP :4501
3|jah-clou | [auth] HTTP :4501
3|jah-clou | [auth] HTTP :4501

/Users/jahanthony/.pm2/logs/jah-cloud-auth-error.log last 30 lines:
3|jah-clou | [auth] TLS certs not found — running plain HTTP
3|jah-clou | [auth] TLS certs not found — running plain HTTP
3|jah-clou | [auth] TLS certs not found — running plain HTTP
3|jah-clou | [auth] TLS certs not found — running plain HTTP
3|jah-clou | [auth] TLS certs not found — running plain HTTP
3|jah-clou | [auth] TLS certs not found — running plain HTTP
3|jah-clou | [auth] unhandled error: Error: secretOrPrivateKey must have a value
3|jah-clou |     at module.exports [as sign] (/Volumes/Home/jah-cloud/server/node_modules/jsonwebtoken/sign.js:111:20)
3|jah-clou |     at generateAccessToken (/Volumes/Home/jah-cloud/server/utils/tokens.js:5:14)
3|jah-clou |     at /Volumes/Home/jah-cloud/server/routes/auth.js:122:25

jahanthony@Jahs-MacBook-Pro server % 

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

JWT_ACCESS_SECRET=317fde53da247cffe8347a0051cc12514cce8e5fed382494cc792d8a3b96157d1513b9fea3fdb30a933fbf6e3df40e6c016f398f338104be82b39170d1c26859

nano /Volumes/Home/jah-cloud/server/.env

pm2 restart jah-cloud-auth --update-env

rsync -av /Users/jahanthony/jahs-projects/Vault/server/ /Volumes/Home/jah-cloud/server/

"console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e crypto

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

echo "ADMIN_TOKEN= 1419ddc3a5713643818cdd0b5ba01b37833ad686de4a7e02fdf52640c5c87ff0" >> /Users/jahanthony/jah-cloud/server/.env

grep ADMIN_TOKEN /Users/jahanthony/jah-cloud/server/.env


pm2 restart jah-cloud-auth --update-env


jahanthony@Jahs-MacBook-Pro server % node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
1419ddc3a5713643818cdd0b5ba01b37833ad686de4a7e02fdf52640c5c87ff0
jahanthony@Jahs-MacBook-Pro server % echo "ADMIN_TOKEN= 1419ddc3a5713643818cdd0b5ba01b37833ad686de4a7e02fdf52640c5c87ff0" >> /Users/jahanthony/jah-cloud/server/.env
zsh: no such file or directory: /Users/jahanthony/jah-cloud/server/.env
jahanthony@Jahs-MacBook-Pro server

echo "ADMIN_TOKEN=1419ddc3a5713643818cdd0b5ba01b37833ad686de4a7e02fdf52640c5c87ff0" >> /Volumes/Home/jah-cloud/server/.env

grep ADMIN_TOKEN /Volumes/Home/jah-cloud/server/.env

 jah-cloud-auth

 jah-cloud-auth

 jah-cloud-auth

cd ~/jah-cloud/server && pm2 start index.js --name vault-auth

sqlite3 ~/data/vault.sqlite "SELECT DISTINCT user_id FROM bookmarks LIMIT 1"



jahanthony@Jahs-MacBook-Pro server % cd ~/jah-cloud/server && pm2 start index.js --name vault-auth
cd: no such file or directory: /Users/jahanthony/jah-cloud/server
jahanthony@Jahs-MacBook-Pro server % cd  ..
jahanthony@Jahs-MacBook-Pro Tweet-Vault % cd ~/jah-cloud/server && pm2 start index.js --name vault-auth
cd: no such file or directory: /Users/jahanthony/jah-cloud/server
jahanthony@Jahs-MacBook-Pro Tweet-Vault %

cd ~/jah-cloud/server && pm2 start index.js --name vault-auth

sqlite3 ~/data/vault.sqlite "SELECT DISTINCT user_id FROM bookmarks LIMIT 1"


cd ~/jahs-projects/tweet-vault
node seed.js \
  --uid YOUR_FIREBASE_UID \
  --email frontend720@gmail.com \
  --password yourpassword \
  --token 1419ddc3a5713643818cdd0b5ba01b37833ad686de4a7e02fdf52640c5c87ff0

jahanthony@Jahs-MacBook-Pro Home % cd ~/jah-cloud/server && pm2 start index.js --name vault-auth
cd: no such file or directory: /Users/jahanthony/jah-cloud/server
jahanthony@Jahs-MacBook-Pro Home 


# Kill whatever is on 4501
lsof -ti:4501 | xargs kill -9

# Start fresh
cd /Volumes/Home/jah-cloud/server && pm2 start index.js --name vault-auth

curl -sk -o /dev/null -w "%{http_code}" https://localhost:4501/admin/status \
  -H "x-admin-token: 1419ddc3a5713643818cdd0b5ba01b37833ad686de4a7e02fdf52640c5c87ff0"

sqlite3 /Volumes/Home/data/vault.sqlite "SELECT DISTINCT user_id FROM bookmarks LIMIT 3"

Once you have the UID, here are the full ready-to-paste commands for apple-server (replace the two placeholders):

# Replace RANDOM_VAULT_ID with whatever shows up in auth.db
# Replace FIREBASE_UID with what vault.sqlite returns above

ADMIN_TOKEN="1419ddc3a5713643818cdd0b5ba01b37833ad686de4a7e02fdf52640c5c87ff0"

# 1. See current users
sqlite3 /Volumes/Home/jah-cloud/server/data/auth.db "SELECT id, email FROM users"

# 2. Delete the random-ID account
curl -k -X DELETE "https://apple-server.tail8168ce.ts.net:4501/admin/users/RANDOM_VAULT_ID" \
  -H "x-admin-token: $ADMIN_TOKEN"

# 3. Create account with your Firebase UID
curl -k -X POST "https://apple-server.tail8168ce.ts.net:4501/admin/users" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"id": "FIREBASE_UID", "email": "frontend720@gmail.com", "password": "PickAPassword1"}'

# Kill the process holding port 4500 (same fix as last time for 4501)
lsof -ti:4500 | xargs kill -9

# Then restart via PM2 (adjust the process name if different)
pm2 start /Volumes/Home/Tweet-Vault/server/index.js --name tweet-vault

jahanthony@Jahs-MacBook-Pro server % pm2 start /Volumes/Home/Tweet-Vault/server/index.js --name tweet-vault
[PM2][ERROR] Script already launched, add -f option to force re-execution
jahanthony@Jahs-MacBook-Pro server % pm2 start /Volumes/Home/Tweet-Vault/server/index.js --name tweet-vault -f
[PM2] Starting /Volumes/Home/Tweet-Vault/server/index.js in fork_mode (1 instance)
[PM2] Done.
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 3  │ jah-cloud-auth     │ fork     │ 31   │ online    │ 0%       │ 68.8mb   │
│ 0  │ tweet-vault        │ fork     │ 44   │ online    │ 0%       │ 72.0mb   │
│ 6  │ tweet-vault        │ fork     │ 0    │ online    │ 0%       │ 792.0kb  │
│ 4  │ vault-auth         │ fork     │ 5    │ online    │ 0%       │ 66.8mb   │
│ 5  │ vault-auth         │ fork     │ 90   │ errored   │ 0%       │ 0b       │
│ 2  │ vault-viewer       │ fork     │ 1    │ online    │ 0%       │ 76.0mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
jahanthony@Jahs-MacBook-Pro server 

jahanthony@Jahs-MacBook-Pro server % pm2 restart tweet-vault --update-env
[PM2] Applying action restartProcessId on app [tweet-vault](ids: [ 0 ])
[PM2] [tweet-vault](0) ✓
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 3  │ jah-cloud-auth     │ fork     │ 31   │ online    │ 0%       │ 68.8mb   │
│ 0  │ tweet-vault        │ fork     │ 43   │ online    │ 0%       │ 804.0kb  │
│ 4  │ vault-auth         │ fork     │ 5    │ online    │ 0%       │ 66.8mb   │
│ 5  │ vault-auth         │ fork     │ 90   │ errored   │ 0%       │ 0b       │
│ 2  │ vault-viewer       │ fork     │ 1    │ online    │ 0%       │ 76.0mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
jahanthony@Jahs-MacBook-Pro server %

pm2 delete 0        # remove old tweet-vault
pm2 delete 5        # remove errored vault-auth
pm2 restart 6       # restart new tweet-vault so it can bind port 4500

jahanthony@Jahs-MacBook-Pro server % pm2 restart pm2 list
Use --update-env to update environment variables
[PM2][ERROR] Process or Namespace pm2 not found
jahanthony@Jahs-MacBook-Pro server % pm2 restart vault-auth              
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [vault-auth](ids: [ 4 ])
[PM2] [vault-auth](4) ✓
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 3  │ jah-cloud-auth     │ fork     │ 31   │ online    │ 0%       │ 68.9mb   │
│ 6  │ tweet-vault        │ fork     │ 1    │ online    │ 0%       │ 72.1mb   │
│ 4  │ vault-auth         │ fork     │ 6    │ online    │ 0%       │ 800.0kb  │
│ 2  │ vault-viewer       │ fork     │ 1    │ online    │ 0%       │ 76.0mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
jahanthony@Jahs-MacBook-Pro server % 

Then verify with pm2 list that only one tweet-vault and one vault-auth are running and both show online.