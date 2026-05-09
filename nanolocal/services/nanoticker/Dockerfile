FROM netdata/netdata:stable

ARG REMOTE_ADDRESS=127.0.0.1

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_BREAK_SYSTEM_PACKAGES=1 \
    DO_NOT_TRACK=1 \
    DISABLE_TELEMETRY=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        python3-setuptools \
        python3-async-timeout \
        git \
        apache2 \
        ca-certificates \
        curl \
    && printf '\nServerName localhost\n' >> /etc/apache2/apache2.conf \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
RUN git clone https://github.com/gr0vity-dev/nanoticker.git
WORKDIR /usr/src/app/nanoticker
RUN git checkout nano-local-ticker

# Python 3.8+ forbids raw coroutines in asyncio.wait(); 3.11+ raises TypeError.
# Single-line sed avoids docker/buildkit mangling multiline python -c (IndentationError).
RUN sed -i 's|loop\.run_until_complete(asyncio\.wait(futures))|loop.run_until_complete(asyncio.wait([loop.create_task(f) for f in futures]))|' script/calc-reps.py \
    && grep -q 'create_task(f) for f in futures' script/calc-reps.py

# requirements.txt omits async-timeout; apt python3-async-timeout can diverge from pip's interpreter.
RUN python3 -m pip install --no-cache-dir async-timeout \
    && python3 -m pip install --no-cache-dir -r requirements.txt \
    && /usr/bin/python3 -c "import async_timeout; print('async_timeout OK:', async_timeout.__file__)"

RUN mkdir -p /var/lib/netdata/www /usr/share/netdata/web/css /var/lib/netdata/www/css \
    && chmod +x autocopy.sh run_tasks.sh \
    && ./autocopy.sh

RUN echo "repstats_v21: yes" >> /usr/lib/netdata/conf.d/python.d.conf

RUN cp -r /var/www/repstat/public_html/* /var/www/html/ \
    && sed -i "s/localhost/${REMOTE_ADDRESS}/g" /var/www/html/index.html \
    && chown -R root /usr/share/netdata/web/ \
    && chgrp -R root /usr/share/netdata/web/

# Official image is Debian; Alpine used /usr/sbin/httpd.
# Pin Python so Netdata/third-party PATH overrides cannot bypass apt/pip installs.
RUN sed -i 's|/usr/sbin/httpd|/usr/sbin/apache2ctl start|' run_tasks.sh \
    && sed -i 's|python3 ./script/calc-reps.py|/usr/bin/python3 ./script/calc-reps.py|' run_tasks.sh

ENTRYPOINT ["/usr/bin/env"]
CMD ./run_tasks.sh

##RUN THE CONTAINER LIKE THIS:
#docker run -d --network=nano-local -p 42002:80 -p 42003:19999 --name="nl_nanoticker" gr0vity/nanoticker
## Browse localhost:42002 for nano-local-ticker
## Browse localhost:42003 for netdata
