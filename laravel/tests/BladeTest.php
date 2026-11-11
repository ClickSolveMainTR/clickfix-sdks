<?php

declare(strict_types=1);

namespace ClickFix\Laravel\Tests;

use ClickFix\Laravel\Exceptions\MissingConfiguration;
use ClickFix\Laravel\Facades\ClickFix;
use ClickFix\Laravel\Tests\Fixtures\IdentityUser;
use ClickFix\Laravel\Tests\Fixtures\User;
use Illuminate\Support\Facades\Blade;

final class BladeTest extends TestCase
{
    public function test_user_hash_is_hmac_of_the_model_key(): void
    {
        $user = $this->user();
        $expected = hash_hmac('sha256', (string) $user->id, self::IDENTITY_SECRET);
        $this->assertSame($expected, ClickFix::userHash($user));
        $this->assertSame($expected, ClickFix::userHash((string) $user->id));
        $this->assertSame($expected, ClickFix::userHash($user->id));
        $this->assertSame(['user_id' => (string) $user->id, 'name' => 'Ayşe Yılmaz', 'email' => 'ayse@example.com', 'user_hash' => $expected], ClickFix::identity($user));
    }

    public function test_directive_renders_boot_with_identity_and_the_script_tag(): void
    {
        $user = $this->user(['phone' => '+905551112233']);
        $html = Blade::render('<body>@clickfixWidget($user, ["locale" => "tr"])</body>', ['user' => $user]);

        $this->assertStringContainsString('<script src="https://getclickfix.com/widget.js" async></script>', $html);
        $this->assertStringContainsString('window.ClickFix=window.ClickFix||function(){(window.ClickFix.q=window.ClickFix.q||[]).push(arguments)};', $html);
        preg_match('/ClickFix\("boot",(\{.*?\})\);<\/script>/s', $html, $m);
        $boot = json_decode($m[1], true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('wgt_test', $boot['widgetId']);
        $this->assertSame('tr', $boot['locale']);
        $this->assertSame((string) $user->id, $boot['user']['user_id']);
        $this->assertSame(ClickFix::userHash($user), $boot['user']['user_hash']);
        $this->assertSame('Ayşe Yılmaz', $boot['user']['name']);
        $this->assertArrayNotHasKey('phone', $boot['user'], 'phone is null in the default mapping');
        $this->assertStringNotContainsString(self::IDENTITY_SECRET, $html);
    }

    public function test_directive_without_arguments_uses_the_authenticated_user_or_stays_anonymous(): void
    {
        $anonymous = Blade::render('@clickfixWidget');
        $this->assertStringContainsString('ClickFix("boot",{"widgetId":"wgt_test"});', $anonymous);

        $user = $this->user();
        $this->be($user);
        $this->assertStringContainsString('"user_hash":"'.ClickFix::userHash($user).'"', Blade::render('@clickfixWidget'));
        $this->assertStringContainsString('ClickFix("boot",{"widgetId":"wgt_test"});', Blade::render('@clickfixWidget(null)'));
    }

    public function test_output_is_safe_inside_script_and_honours_default_options(): void
    {
        $this->app['config']->set('clickfix.widget.options', ['theme' => 'dark']);
        $user = $this->user(['name' => '</script><b>x</b> & "q"']);
        $html = (string) ClickFix::widget($user);
        $this->assertStringNotContainsString('</script><b>', $html);
        $this->assertStringContainsString('</script>', $html);
        $this->assertStringContainsString('"theme":"dark"', $html);
    }

    public function test_model_can_provide_its_own_identity(): void
    {
        $user = new IdentityUser;
        $identity = ClickFix::identity($user);
        $this->assertSame('crm-77', $identity['user_id']);
        $this->assertSame(hash_hmac('sha256', 'crm-77', self::IDENTITY_SECRET), $identity['user_hash']);
        $this->assertSame(['id' => 'F-77', 'name' => 'Acme'], $identity['company']);
    }

    public function test_missing_widget_id_or_secret_is_a_clear_error(): void
    {
        $this->app['config']->set('clickfix.widget.id', null);
        $this->expectException(MissingConfiguration::class);
        $this->expectExceptionMessage('CLICKFIX_WIDGET_ID');
        ClickFix::widget();
    }

    public function test_missing_identity_secret_is_a_clear_error(): void
    {
        $this->app['config']->set('clickfix.widget.identity_secret', '');
        $this->expectException(MissingConfiguration::class);
        $this->expectExceptionMessage('CLICKFIX_IDENTITY_SECRET');
        ClickFix::userHash('1');
    }
}
