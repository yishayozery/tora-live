# Pi Room Daemon — Setup

מדריך להתקנת ה-daemon על Raspberry Pi 5 בחדר שיעור.

## דרישות חומרה

- Raspberry Pi 5 (או 4) עם 4GB+ RAM
- כרטיס microSD 32GB+
- ספק כוח רשמי 27W
- מצלמת USB (Logitech C920/C922 מומלץ)
- מיקרופון USB (lavalier או XLR + ממשק USB)
- חיבור Ethernet (יציב יותר מ-WiFi לשידור חי)

## התקנה (חד-פעמית)

### 1. Raspberry Pi OS

צרוב Raspberry Pi OS Lite (64-bit) ל-microSD עם Raspberry Pi Imager.
הגדר ב-Imager:
- Hostname: `tora-room-{name}` (למשל `tora-room-beit-midrash`)
- User: `pi` + סיסמה
- SSH: enabled
- WiFi/Ethernet: מוגדר מראש

### 2. עדכון המערכת

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ffmpeg python3-pip git
pip3 install requests
```

### 3. בדוק שהמצלמה והמיק עובדים

```bash
# מצלמות מחוברות:
v4l2-ctl --list-devices

# התקני אודיו:
arecord -L
```

צריך לראות `/dev/video0` (מצלמה) ו-`hw:1,0` או דומה (מיק).

### 4. התקן את ה-daemon

```bash
sudo mkdir -p /opt/tora-room
cd /opt/tora-room
sudo curl -o pi-room-daemon.py https://raw.githubusercontent.com/yishayozery/tora-live/main/scripts/pi-room-daemon.py
sudo curl -o tora-room.service https://raw.githubusercontent.com/yishayozery/tora-live/main/scripts/tora-room.service
sudo chmod +x pi-room-daemon.py
sudo cp tora-room.service /etc/systemd/system/
```

### 5. קבע את הקונפיג

קבל את ה-`room_id` ו-`device_token` מהרכז (נראה בדף יצירת החדר ב-TORA_LIVE).

```bash
sudo nano /etc/tora-room.json
```

תוכן:
```json
{
  "api_base": "https://torah-live-rho.vercel.app",
  "room_id": "cmpXXXXXXXX",
  "device_token": "abcdef0123456789...",
  "video_device": "/dev/video0",
  "audio_device": "hw:1,0",
  "resolution": "1280x720",
  "framerate": 30,
  "video_bitrate": "2500k",
  "audio_bitrate": "128k"
}
```

```bash
sudo chmod 600 /etc/tora-room.json
sudo chown pi:pi /etc/tora-room.json
```

### 6. הפעל את ה-service

```bash
sudo systemctl daemon-reload
sudo systemctl enable tora-room.service
sudo systemctl start tora-room.service
```

## ניטור

```bash
# סטטוס נוכחי:
sudo systemctl status tora-room.service

# log חי:
sudo journalctl -u tora-room.service -f

# log של היום:
sudo journalctl -u tora-room.service --since today
```

## בדיקה ראשונה

1. ברכז ב-`/dashboard/institution/[slug]` תראה את החדר כ-🟡 מוכן
2. לחץ "התחל שידור" → תוך 10-15 שניות הסטטוס משתנה ל-🟢 משדר
3. תוך 5-10 שניות נוספות הזרם זמין ב-`/lesson/{id}` של השיעור הפעיל

## פתרון בעיות

| תופעה | סיבה | פתרון |
|---|---|---|
| 🔴 אופליין בדשבורד | Pi לא מגיע ל-API | בדוק `journalctl` — בעיית רשת או device_token שגוי |
| ffmpeg קורס מיד | מצלמה/מיק לא נמצאים | בדוק שה-paths ב-config תואמים `v4l2-ctl --list-devices` ו-`arecord -L` |
| איכות וידאו ירודה | bitrate נמוך מדי | העלה `video_bitrate` ל-`4000k` (אם החיבור מאפשר) |
| השהיה גבוהה | רשת איטית | החלף ל-Ethernet, או הקטן `resolution` ל-`854x480` |

## עדכון

```bash
sudo systemctl stop tora-room.service
sudo curl -o /opt/tora-room/pi-room-daemon.py https://raw.githubusercontent.com/yishayozery/tora-live/main/scripts/pi-room-daemon.py
sudo systemctl start tora-room.service
```
