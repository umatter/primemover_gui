# Inject the API endpoint into the built index.html at container start.
#
# The bundle is environment-agnostic: index.html ships
#   <meta name="config" property="api" content="">
# and src/app/app-config.ts reads that tag, falling back to the build-time
# environment when it is empty. Filling it in here is what lets one image be
# deployed against any API host without rebuilding.
#
# Sourced from the image entrypoint with the document root as the working
# directory.
#
# POSIX sh only: the serving image is Alpine, whose /bin/sh is busybox ash.
# This previously used bash's `[[ -v ... ]]`, which ash does not implement, so
# the script aborted and the tag was left silently empty.

if [ -n "${API_ENDPOINT:-}" ]; then
  # Escape what is special on the right-hand side of sed's s|||. An endpoint is
  # a URL, so | and & are the realistic hazards.
  escaped=$(printf '%s' "$API_ENDPOINT" | sed -e 's|[\\&|]|\\&|g')

  # Match the tag loosely, and in particular handle BOTH spellings of the empty
  # attribute. The source ships content="" but Angular's production HTML
  # minifier rewrites an empty attribute to bare `content`, so a pattern that
  # only matched content="" silently did nothing against a real build -- the
  # app then fell back to the relative path and every request went to the GUI's
  # own origin.
  sed -i -E \
    -e "s|(<meta[^>]*name=\"config\"[^>]*)content=\"\"|\1content=\"${escaped}\"|g" \
    -e "s|(<meta[^>]*name=\"config\"[^>]*)content([ />])|\1content=\"${escaped}\"\2|g" \
    index.html

  if grep -q "content=\"${API_ENDPOINT}\"" index.html; then
    echo "set-config: API_ENDPOINT injected -> ${API_ENDPOINT}"
  else
    # Loud, because the fallback is a same-origin relative path: the app would
    # otherwise come up and fail every request against the wrong origin.
    echo "set-config: WARNING could not inject API_ENDPOINT into index.html" >&2
  fi
else
  echo "set-config: API_ENDPOINT not set, using the bundle's built-in fallback" >&2
fi
